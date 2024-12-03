/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
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
import { getTransferSolInstruction } from '@solana-program/system';
import type { Blockhash } from '@solana/web3.js';
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairFromPrivateKeyBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  getAddressFromPublicKey,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/web3.js';
import { assert, type Struct } from 'superstruct';

import {
  LAMPORTS_PER_SOL,
  SOL_SYMBOL,
  SolanaCaip19Tokens,
  type SolanaCaip2Networks,
} from '../constants/solana';
import { deriveSolanaPrivateKey } from '../utils/derive-solana-private-key';
import { getClusterFromScope } from '../utils/get-cluster-from-scope';
import { getLowestUnusedIndex } from '../utils/get-lowest-unused-index';
import { getNetworkFromToken } from '../utils/get-network-from-token';
import logger from '../utils/logger';
import { logMaybeSolanaError } from '../utils/logMaybeSolanaError';
import type { TransferSolParams } from '../validation/structs';
import {
  GetAccounBalancesResponseStruct,
  TransferSolParamsStruct,
} from '../validation/structs';
import { validateRequest } from '../validation/validators';
import type { SolanaConnection } from './connection';
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

  readonly #connection: SolanaConnection;

  constructor(connection: SolanaConnection) {
    this.#state = new SolanaState();
    this.#connection = connection;
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
      // eslint-disable-next-line no-restricted-globals
      const id = crypto.randomUUID();
      const keyringAccounts = await this.listAccounts();
      const index = getLowestUnusedIndex(keyringAccounts);

      const privateKeyBytes = await deriveSolanaPrivateKey(index);
      const privateKeyBytesAsNum = Array.from(privateKeyBytes);

      const keyPair = await createKeyPairFromPrivateKeyBytes(privateKeyBytes);

      const accountAddress = await getAddressFromPublicKey(keyPair.publicKey);

      const keyringAccount: SolanaKeyringAccount = {
        id,
        index,
        privateKeyBytesAsNum,
        type: SolAccountType.DataAccount,
        address: accountAddress,
        options: options ?? {},
        methods: [SolMethod.SendAndConfirmTransaction],
      };

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
      logger.error({ error }, 'Error creating account');
      throw new Error('Error creating account');
    }
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

  async getAccountBalances(
    id: string,
    assets: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    try {
      const account = await this.getAccount(id);
      const balances = new Map<string, [string, string]>();

      if (!account) {
        throw new Error('Account not found');
      }

      const assetsByNetwork = assets.reduce<
        Record<SolanaCaip2Networks, string[]>
      >((groups, asset) => {
        const network = getNetworkFromToken(asset) as SolanaCaip2Networks;
        if (!groups[network]) {
          groups[network] = [];
        }
        groups[network].push(asset);
        return groups;
      }, {} as Record<SolanaCaip2Networks, string[]>);

      for (const network of Object.keys(assetsByNetwork)) {
        const currentNetwork = network as SolanaCaip2Networks;
        const networkAssets = assetsByNetwork[currentNetwork];

        for (const asset of networkAssets) {
          if (asset.endsWith(SolanaCaip19Tokens.SOL)) {
            const response = await this.#connection
              .getRpc(currentNetwork)
              .getBalance(address(account.address))
              .send();

            const balance = String(Number(response.value) / LAMPORTS_PER_SOL);
            balances.set(asset, [SOL_SYMBOL, balance]);
            logger.log(
              { asset, balance, network: currentNetwork },
              'Native SOL balance',
            );
          } else {
            // Tokens: unsuported
            logger.log({ asset, network: currentNetwork }, 'Unsupported asset');
          }
        }
      }

      const response = Object.fromEntries(
        [...balances.entries()].map(([key, [unit, amount]]) => [
          key,
          { amount, unit },
        ]),
      );
      assert(response, GetAccounBalancesResponseStruct);

      return response;
    } catch (error: any) {
      logMaybeSolanaError(error);
      logger.error({ error }, 'Error getting account balances');
      throw new Error('Error getting account balances');
    }
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    throw new Error(`Implement me! ${id} ${chains.toString()}`);
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    throw new Error(`Implement me! ${JSON.stringify(account)}`);
  }

  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    return { pending: false, result: await this.#handleSubmitRequest(request) };
  }

  async #handleSubmitRequest(request: KeyringRequest): Promise<Json> {
    const { scope, account: accountId } = request;
    const { method, params } = request.request;

    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    switch (method) {
      case SolMethod.SendAndConfirmTransaction: {
        const signature = await this.#transferSol(
          account,
          params as TransferSolParams,
          scope as SolanaCaip2Networks,
        );
        return { signature };
      }

      default:
        throw new MethodNotFoundError() as Error;
    }
  }

  /**
   * Transfer SOL from one account to another.
   *
   * @param account - The account from which the SOL will be transferred.
   * @param params - The parameters for the transfer.
   * @param network - The network on which to transfer the SOL.
   * @returns The signature of the transaction.
   * @see https://github.com/solana-labs/solana-web3.js/blob/master/examples/transfer-lamports/src/example.ts
   */
  async #transferSol(
    account: SolanaKeyringAccount,
    params: TransferSolParams,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    validateRequest(params, TransferSolParamsStruct as Struct<any>);

    const { to, amount } = params;
    const amountInLamports = lamports(BigInt(amount * LAMPORTS_PER_SOL));

    const sendTransactionWithoutConfirming =
      sendTransactionWithoutConfirmingFactory({
        rpc: this.#connection.getRpc(network),
      });

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
    const latestBlockhash = await this.#getLatestBlockhash(network);

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
            amount: amountInLamports,
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
    const cluster = getClusterFromScope(network)?.toLowerCase() ?? 'mainnet';
    logger.info(
      `Sending transaction: https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
    );

    try {
      await sendTransactionWithoutConfirming(signedTransaction, {
        commitment: 'confirmed',
      });
      return signature;
    } catch (error: any) {
      logMaybeSolanaError(error, transactionMessage);
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
   * @param network - The network on which to get the latest blockhash.
   * @returns The latest blockhash and the last valid block height.
   */
  async #getLatestBlockhash(network: SolanaCaip2Networks): Promise<
    Readonly<{
      blockhash: Blockhash;
      lastValidBlockHeight: bigint;
    }>
  > {
    try {
      const latestBlockhashResponse = await this.#connection
        .getRpc(network)
        .getLatestBlockhash()
        .send();

      return latestBlockhashResponse.value;
    } catch (error: any) {
      logMaybeSolanaError(error);
      throw error;
    }
  }
}
