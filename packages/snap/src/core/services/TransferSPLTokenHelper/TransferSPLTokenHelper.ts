import type BigNumber from 'bignumber.js';

import type { SolanaCaip2Networks } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { SolanaKeyringAccount } from '../keyring';
import type { TransactionHelper } from '../TransactionHelper/TransactionHelper';

export class TransferSPLTokenHelper {
  readonly #transactionHelper: TransactionHelper;

  readonly #logger: ILogger;

  constructor(transactionHelper: TransactionHelper, logger: ILogger) {
    this.#transactionHelper = transactionHelper;
    this.#logger = logger;
  }

  /**
   * Execute a transaction to transfer an SPL token from one account to another.
   *
   * @param from - The account from which the token will be transferred.
   * @param to - The address to which the token will be transferred.
   * @param assetCaip19Id - The CAIP-19 ID of the asset to transfer.
   * @param amountInSol - The amount of the asset to transfer.
   * @param network - The network on which to transfer the asset.
   * @returns The signature of the transaction.
   */
  async transferSPLToken(
    from: SolanaKeyringAccount,
    to: string,
    assetCaip19Id: string,
    amountInSol: string | number | bigint | BigNumber,
    network: SolanaCaip2Networks,
  ): Promise<string> {
    // TODO: Implement SPL token transfer
    throw new Error('Unsupported asset');
  }
}
