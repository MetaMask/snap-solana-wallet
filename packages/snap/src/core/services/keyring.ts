import {
  emitSnapKeyringEvent,
  KeyringEvent,
  SolAccountType,
  SolMethod,
  type Balance,
  type CaipAssetType,
  type Keyring,
  type KeyringAccount,
  type KeyringRequest,
  type KeyringResponse,
} from '@metamask/keyring-api';
import { MethodNotFoundError, type Json } from '@metamask/snaps-sdk';
import {
  getSystemErrorMessage,
  getTransferSolInstruction,
  isSystemError,
} from '@solana-program/system';
import type {
  Blockhash,
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from '@solana/web3.js';
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getAddressFromPublicKey,
  getSignatureFromTransaction,
  isSolanaError,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from '@solana/web3.js';
import type { Struct } from 'superstruct';
import { assert } from 'superstruct';
import { v4 as uuidv4 } from 'uuid';

import { CAIP2_TO_SOLANA_CLUSTER } from '../constants/caip2-to-solana-cluster';
import { LAMPORTS_PER_SOL, SOL_CAIP_19, SOL_SYMBOL } from '../constants/solana';
import { deriveSolanaPrivateKey } from '../utils/derive-solana-private-key';
import { getLowestUnusedKeyringAccountIndex } from '../utils/get-lowest-unused-keyring-account-index';
import { getProvider } from '../utils/get-provider';
import logger from '../utils/logger';
import {
  GetAccounBalancesResponseStruct,
  TransferSolParamsStruct,
  type TransferSolParams,
} from '../validation/structs';
import { validateRequest } from '../validation/validators';
import { SolanaState } from './state';

/**
 * We need to store the index of the KeyringAccount in the state because
 * we want to be able to restore any account with a previously used index.
 */
export type SolanaKeyringAccount = {
  index: number;
  privateKeyBytesAsNum: number[];
} & KeyringAccount;

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  readonly #rpc: Rpc<SolanaRpcApi>;

  readonly #rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;

  readonly #sendAndConfirmTransaction: any; // Type isn't exported from the `@solana/web3.js` package

  constructor() {
    this.#state = new SolanaState();
    this.#rpc = createSolanaRpc('https://api.devnet.solana.com');
    this.#rpcSubscriptions = createSolanaRpcSubscriptions(
      'ws://api.devnet.solana.com:8900',
    );
    // Create a reusable transaction sender.
    this.#sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      /**
       * The RPC implements a `sendTransaction` method which relays transactions to the network.
       */
      rpc: this.#rpc,
      /**
       * RPC subscriptions allow the transaction sender to subscribe to the status of our transaction.
       * The sender will resolve when the transaction is reported to have been confirmed, or will
       * reject in the event of an error, or a timeout if the transaction lifetime is thought to have
       * expired.
       */
      rpcSubscriptions: this.#rpcSubscriptions,
    });
  }

  async listAccounts(): Promise<SolanaKeyringAccount[]> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return Object.values(keyringAccounts).sort((a, b) => a.index - b.index);
    } catch (error: any) {
      logger.error({ error }, 'Error listing accounts');
      throw new Error('Error listing accounts');
    }
  }

  async getAccount(id: string): Promise<SolanaKeyringAccount | undefined> {
    try {
      const currentState = await this.#state.get();
      const keyringAccounts = currentState?.keyringAccounts ?? {};

      return keyringAccounts?.[id];
    } catch (error: any) {
      logger.error({ error }, 'Error getting account'); // TODO: This can only fail in one way. Failed to read the state.
      throw new Error('Error getting account');
    }
  }

  async createAccount(
    options?: Record<string, Json>,
  ): Promise<SolanaKeyringAccount> {
    try {
      const id = uuidv4();
      const keyringAccounts = await this.listAccounts();
      const index = getLowestUnusedKeyringAccountIndex(keyringAccounts);

      const privateKeyBytes = await deriveSolanaPrivateKey(index);
      const privateKeyBytesAsNum = Array.from(privateKeyBytes);
      console.log('🦊', 'privateKeyBytes', privateKeyBytes);
      console.log('🦊', 'privateKeyBytesAsNum', privateKeyBytesAsNum);

      const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);
      console.log('🦊', 'keyPair', keyPair);

      const accountAddress = await getAddressFromPublicKey(keyPair.publicKey);
      console.log('🦊', 'accountAddress', accountAddress);

      const keyringAccount: SolanaKeyringAccount = {
        id,
        index,
        privateKeyBytesAsNum,
        type: SolAccountType.DataAccount,
        address: accountAddress,
        options: options ?? {},
        methods: [`${SolMethod.SendAndConfirmTransaction}`],
      };
      console.log('🦊', 'keyringAccount', keyringAccount);

      logger.log(
        { keyringAccount },
        `New keyring account object created, sending it to the extension...`,
      );

      await this.#emitEvent(KeyringEvent.AccountCreated, {
        /**
         * We can't pass the `keyringAccount` object because it contains the index
         * and the snaps sdk does not allow extra properties.
         */
        account: {
          type: keyringAccount.type,
          id: keyringAccount.id,
          address: keyringAccount.address,
          options: keyringAccount.options,
          methods: keyringAccount.methods,
        },
        accountNameSuggestion: `Solana Account ${index + 1}`,
      });

      logger.log(
        `Account created in the extension, now updating the snap state...`,
      );

      await this.#state.update((state) => {
        return {
          ...state,
          keyringAccounts: {
            ...(state?.keyringAccounts ?? {}),
            [keyringAccount.id]: keyringAccount,
          },
        };
      });

      logger.log({ keyringAccount }, `State updated with new keyring account`);

      return keyringAccount;
    } catch (error: any) {
      console.error('Error creating account', error);
      logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
  }

  async getAccountBalances(
    id: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      const account = await this.getAccount(id);
      const balances = new Map<string, string>();

      if (!account) {
        throw new Error('Account not found');
      }

      for (const asset of assets) {
        if (asset === SOL_CAIP_19) {
          const response = await this.#rpc
            .getBalance(address(account.address))
            .send();

          const balance = Number(response.value) / LAMPORTS_PER_SOL;
          balances.set(asset, String(balance));
        }
      }

      const response = Object.fromEntries(
        [...balances.entries()].map(([key, value]) => [
          key,
          { amount: value, unit: SOL_SYMBOL },
        ]),
      );

      assert(response, GetAccounBalancesResponseStruct);

      return response;
    } catch (error: any) {
      logger.error({ error }, 'Error getting account balances');
      throw new Error('Error getting account balances');
    }
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(getProvider(), event, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateAccount(account: KeyringAccount): Promise<void> {
    // TODO: Implement method, this is a placeholder
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.#state.update((state) => {
        delete state?.keyringAccounts?.[id];
        return state;
      });
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
    } catch (error: any) {
      logger.error({ error }, 'Error deleting account');
      throw new Error('Error deleting account');
    }
  }

  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // method: 'keyring_submitRequest',
    // {
    //   id: uuidV4(),
    //   account,
    //   scope: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    //   request: {
    //     method: `${SolMethod.SendAndConfirmTransaction}`,
    //     params: {
    //       to: SOL_ADDRESS,
    //       amount: '0.00000500', solana amount
    //     },
    //   },
    // },

    const { scope, account: accountId } = request;
    const { method, params } = request.request;
    console.log({ scope, accountId, method, params });

    const account = await this.getAccount(accountId);
    console.log({ account });

    if (!account) {
      throw new Error('Account not found');
    }

    if (!params) {
      throw new Error(`Method ${method} called without params`);
    }

    const cluster = CAIP2_TO_SOLANA_CLUSTER[scope];

    if (!cluster) {
      throw new Error(`Unrecognized scope: ${scope}`);
    }

    switch (method) {
      case `${SolMethod.SendAndConfirmTransaction}`: {
        const signature = await this.#transferSol(
          account,
          params as TransferSolParams,
        );
        return { pending: false, result: { signature } };
      }
      default:
        throw new MethodNotFoundError() as Error;
    }
  }

  async #transferSol(
    account: SolanaKeyringAccount,
    params: TransferSolParams,
  ): Promise<string> {
    logger.log({ params }, 'Transferring SOL...');

    validateRequest(params, TransferSolParamsStruct as Struct<any>);
    const { to, amount } = params;

    /**
     * The source account from which the tokens will be transferred needs to sign the transaction. We need to
     * create a `TransactionSigner` for it.
     */
    const from = await createKeyPairSignerFromPrivateKeyBytes(
      Uint8Array.from(account.privateKeyBytesAsNum),
    );

    /**
     * Since the account to which the tokens will be transferred does not need to sign the transaction
     * to receive them, we only need an address.
     */
    const toAddress = address(to);

    const latestBlockhash = await this.#getLatestBlockhash();

    /**
     * Create the transaction message.
     */
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      // Every transaction must state from which account the transaction fee should be debited from,
      // and that account must sign the transaction. Here, we'll make the source account pay the fee.
      (tx) => setTransactionMessageFeePayer(from.address, tx),
      // A transaction is valid for execution as long as it includes a valid lifetime constraint. Here
      // we supply the hash of a recent block. The network will accept this transaction until it
      // considers that hash to be 'expired' for the purpose of transaction execution.
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      // Every transaction needs at least one instruction. This instruction describes the transfer.
      (tx) =>
        appendTransactionMessageInstruction(
          /**
           * The system program has the exclusive right to transfer Lamports from one account to
           * another. Here we use an instruction creator from the `@solana-program/system` package
           * to create a transfer instruction for the system program.
           */
          getTransferSolInstruction({
            amount,
            destination: toAddress,
            /**
             * By supplying a `TransactionSigner` here instead of just an address, we give this
             * transaction message superpowers. Later the
             * `signTransactionMessageWithSigners` method, in consideration of the fact that the
             * source account must sign System program transfer instructions, will use this
             * `TransactionSigner` to produce a transaction signed on behalf of
             * `from.address`, without any further configuration.
             */
            source: from,
          }),
          tx,
        ),
    );

    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessage,
    );

    const signature = getSignatureFromTransaction(signedTransaction);

    /**
     * Send and confirm the transaction.
     * Now that the transaction is signed, we send it to an RPC. The RPC will relay it to the Solana
     * network for execution. The `sendAndConfirmTransaction` method will resolve when the transaction
     * is reported to have been confirmed. It will reject in the event of an error (eg. a failure to
     * simulate the transaction), or may timeout if the transaction lifetime is thought to have expired
     * (eg. the network has progressed past the `lastValidBlockHeight` of the transaction's blockhash
     * lifetime constraint).
     */

    logger.info(
      `Sending transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );

    try {
      await this.#sendAndConfirmTransaction(signedTransaction, {
        commitment: 'confirmed',
      });
      logger.info('Transfer confirmed');
      return signature;
    } catch (error: any) {
      if (
        isSolanaError(
          error,
          SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
        )
      ) {
        const preflightErrorContext = error.context;
        const preflightErrorMessage = error.message;
        const errorDetailMessage = isSystemError(
          error.cause,
          transactionMessage,
        )
          ? getSystemErrorMessage(error.cause.context.code)
          : error.cause?.message;
        logger.error(
          preflightErrorContext,
          '%s: %s',
          preflightErrorMessage,
          errorDetailMessage,
        );
      }
      throw error;
    }
  }

  /**
   * Every transaction needs to specify a valid lifetime for it to be accepted for execution on the
   * network. This utility method fetches the latest block's hash as proof that the
   * transaction was prepared close in time to when we tried to execute it. The network will accept
   * transactions which include this hash until it progresses past the block specified as
   * `latestBlockhash.lastValidBlockHeight`.
   *
   * TIP: It is desirable for the program to fetch this block hash as late as possible before signing
   * and sending the transaction so as to ensure that it's as 'fresh' as possible.
   *
   * @returns The latest blockhash and the last valid block height.
   */
  async #getLatestBlockhash(): Promise<
    Readonly<{
      blockhash: Blockhash;
      lastValidBlockHeight: bigint;
    }>
  > {
    const latestBlockhashResponse = await this.#rpc.getLatestBlockhash().send();
    return latestBlockhashResponse.value;
  }
}
