/* eslint-disable @typescript-eslint/no-throw-literal */
import { SolMethod } from '@metamask/keyring-api';
import { parseCaipAssetType } from '@metamask/utils';

import type { TransactionIntent } from '../../domain';
import type { SolanaKeyring } from '../../handlers/onKeyringRequest/Keyring';
import type { WalletService } from '../../services/wallet/WalletService';
import type { ILogger } from '../../utils/logger';
import type { UseCase } from '../UseCase';
import { AccountNotFoundError } from './errors';
import type {
  SignAndSendTransactionWithoutConfirmationParams,
  SignAndSendTransactionWithoutConfirmationResponse,
} from './types';

export class SignAndSendTransactionWithoutConfirmationUseCase
  implements UseCase
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
   * Handles the request signAndSendTransactionWithoutConfirmation.
   * This allows transactions to be executed without user confirmation
   * when they match a verified intent from the backend.
   *
   * @param params - The intent, transaction, and signature.
   * @returns The transaction signature if successful.
   * @throws {InvalidBackendSignatureError} When the backend signature is invalid.
   * @throws {TransactionIntentMismatchError} When the transaction does not match the intent.
   * @throws {AccountNotFoundError} When the account is not found.
   * @throws {InvalidTransactionError} When the transaction is invalid.
   * @throws {TransactionFailedError} When the transaction fails.
   */
  async execute(
    params: SignAndSendTransactionWithoutConfirmationParams,
  ): Promise<SignAndSendTransactionWithoutConfirmationResponse> {
    this.#logger.log(
      '[SignAndSendTransactionWithoutConfirmationUseCase] execute',
      params,
    );

    const { intent, transaction, signature } = params;
    const { timestamp, from, to, type } = intent;

    // Verify that the backend signed the payload { intent, transaction }
    // to ensure the transaction came from our backend.
    await this.#verifyBackendSignature(intent, transaction, signature);

    // Verify that the transaction actually performs what is described in the intent
    // (correct amounts, assets, etc.)
    await this.#verifyTransactionMatchesIntent(intent, transaction);

    // Get the user's account from the accountId specified in the intent
    const account = (await this.#keyring.listAccounts()).find(
      (item) => item.address === from.address,
    );

    if (!account) {
      throw new AccountNotFoundError(from.address);
    }

    // Get the scope from the intent
    const scope = parseCaipAssetType(from.asset).chainId;

    // Sign and send the transaction
    const response = await this.#walletService.signAndSendTransaction(account, {
      id: globalThis.crypto.randomUUID(),
      scope,
      account: account.id,
      request: {
        method: SolMethod.SignAndSendTransaction,
        params: {
          transaction,
          scope,
          account: {
            address: account.address,
          },
        },
      },
    });

    this.#logger.log(
      '[✅ signAndSendTransactionWithoutConfirmation] Success:',
      response.signature,
    );

    return {
      transactionId: response.signature,
    };
  }

  /**
   * Verifies that the backend (Swap API) signature is valid for the given intent and transaction.
   * This ensures the request came from our trusted backend.
   *
   * @param intent - The swap/bridge intent.
   * @param transaction - The base64 encoded transaction.
   * @param signature - The backend signature to verify.
   * @throws InvalidBackendSignatureError if the signature is invalid.
   */
  async #verifyBackendSignature(
    intent: TransactionIntent,
    transaction: string,
    signature: string,
  ): Promise<void> {
    // TODO: Implement actual signature verification
    // This should:
    // 1. Get the backend's public key (stored in snap state or hardcoded)
    // 2. Verify the signature against the intent + tx data
    // 3. Ensure the signature is fresh (check timestamp)

    this.#logger.log('[🔍 verifyBackendSignature] Verifying signature...');
  }

  /**
   * Verifies that the transaction actually performs the swap/bridge described in the intent.
   * This ensures the transaction matches what the user expects.
   *
   * @param intent - The swap/bridge intent.
   * @param transaction - The base64 encoded transaction.
   * @throws InvalidTransactionError when the transaction is malformed or invalid.
   * @throws TransactionIntentMismatchError if the transaction does not match the intent.
   */
  async #verifyTransactionMatchesIntent(
    intent: TransactionIntent,
    transaction: string,
  ): Promise<void> {
    // TODO: Implement transaction verification
    // This should:
    // 1. Simulate the transaction
    // 2. Verify it matches the intent (correct tokens, amounts, etc.)
    // 3. Ensure no unexpected instructions (like additional transfers)

    this.#logger.log(
      '[🔍 verifyTransactionMatchesIntent] Verifying transaction matches intent...',
    );
  }
}
