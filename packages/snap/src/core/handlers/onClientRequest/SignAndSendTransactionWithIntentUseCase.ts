import { SolMethod } from '@metamask/keyring-api';
import { assert, literal, object } from '@metamask/superstruct';
import type { Json, JsonRpcRequest } from '@metamask/utils';

import { Network } from '../../constants/solana';
import type { WalletService } from '../../services/wallet/WalletService';
import type { ILogger } from '../../utils/logger';
import type { SolanaKeyring } from '../onKeyringRequest/Keyring';
import type { ClientRequestUseCase } from './types';
import {
  ClientRequestMethod,
  SignAndSendTransactionWithIntentParamsStruct,
} from './types';

export class SignAndSendTransactionWithIntentUseCase
  implements ClientRequestUseCase
{
  #keyring: SolanaKeyring;

  #walletService: WalletService;

  #logger: ILogger;

  constructor(
    keyring: SolanaKeyring,
    walletService: WalletService,
    logger: ILogger,
  ) {
    this.#keyring = keyring;
    this.#walletService = walletService;
    this.#logger = logger;
  }

  /**
   * Handles the signAndSendTransactionWithIntent method for client requests.
   * This allows swap/bridge transactions to be executed without user confirmation
   * when they match a verified intent from the backend.
   *
   * @param request - The JSON-RPC request containing the intent, transaction, and signature.
   * @returns The transaction signature if successful.
   */
  async execute(request: JsonRpcRequest): Promise<Json> {
    this.#logger.log(
      '[SignAndSendTransactionWithIntentUseCase] execute',
      request,
    );

    const { method, params } = request;

    assert(
      method,
      literal(ClientRequestMethod.SignAndSendTransactionWithIntent),
    );
    assert(params, SignAndSendTransactionWithIntentParamsStruct);

    const { intent, tx, signature } = params;

    // TODO: Implement signature verification
    // This should verify that the backend signed the intent and transaction
    // to ensure the transaction came from our backend and matches the user's intent
    const isValidSignature = await this.#verifyBackendSignature(
      intent,
      tx,
      signature,
    );

    if (!isValidSignature) {
      throw new Error('Invalid backend signature');
    }

    // TODO: Implement transaction vs intent verification
    // This should verify that the transaction actually performs the swap/bridge
    // described in the intent (correct amounts, assets, etc.)
    const transactionMatchesIntent = await this.#verifyTransactionMatchesIntent(
      intent,
      tx,
    );

    if (!transactionMatchesIntent) {
      throw new Error('Transaction does not match intent');
    }

    // Get the user's account
    // For now, we'll use the first account, but this should be determined
    // based on the intent's from address
    const account = (await this.#keyring.listAccounts())[0];
    assert(account, object());

    // TODO: Determine the correct network from the intent
    // For now, defaulting to mainnet
    const scope: Network = Network.Mainnet;

    // Sign and send the transaction
    const response = await this.#walletService.signAndSendTransaction(account, {
      id: globalThis.crypto.randomUUID(),
      scope,
      account: account.id,
      request: {
        method: SolMethod.SignAndSendTransaction,
        params: {
          transaction: tx,
          scope,
          account: {
            address: account.address,
          },
        },
      },
    });

    this.#logger.log(
      '[✅ signAndSendTransactionWithIntent] Success:',
      response.signature,
    );

    return {
      signature: response.signature,
      intent,
    };
  }

  /**
   * Verifies that the backend (Swap API) signature is valid for the given intent and transaction.
   * This ensures the request came from our trusted backend.
   *
   * @param intent - The swap/bridge intent.
   * @param tx - The base64 encoded transaction.
   * @param signature - The backend signature to verify.
   * @returns True if the signature is valid.
   */
  async #verifyBackendSignature(
    intent: any,
    tx: string,
    signature: string,
  ): Promise<boolean> {
    // TODO: Implement actual signature verification
    // This should:
    // 1. Get the backend's public key (stored in snap state or hardcoded)
    // 2. Verify the signature against the intent + tx data
    // 3. Ensure the signature is fresh (check timestamp)

    this.#logger.log('[🔍 verifyBackendSignature] Verifying signature...');

    // For now, return true to allow development
    // In production, this MUST be implemented properly
    return true;
  }

  /**
   * Verifies that the transaction actually performs the swap/bridge described in the intent.
   * This ensures the transaction matches what the user expects.
   *
   * @param intent - The swap/bridge intent.
   * @param tx - The base64 encoded transaction.
   * @returns True if the transaction matches the intent.
   */
  async #verifyTransactionMatchesIntent(
    intent: any,
    tx: string,
  ): Promise<boolean> {
    // TODO: Implement transaction verification
    // This should:
    // 1. Decode the transaction
    // 2. Analyze the instructions to understand what the transaction does
    // 3. Verify it matches the intent (correct tokens, amounts, etc.)
    // 4. Ensure no unexpected instructions (like additional transfers)

    this.#logger.log(
      '[🔍 verifyTransactionMatchesIntent] Verifying transaction matches intent...',
    );

    // For now, return true to allow development
    // In production, this MUST be implemented properly
    return true;
  }
}
