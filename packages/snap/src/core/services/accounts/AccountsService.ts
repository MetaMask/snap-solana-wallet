import { differenceBy, uniq } from 'lodash';

import type { SolanaKeyringAccount } from '../../../entities';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { AssetsService } from '../assets/AssetsService';
import type { TransactionsService } from '../transactions';
import type { AccountsRepository } from './AccountsRepository';
import { CouldNotFetchTransactionsError } from './errors/CouldNotFetchTransactionsError';

export class AccountsService {
  readonly #accountsRepository: AccountsRepository;

  readonly #transactionsService: TransactionsService;

  readonly #assetsService: AssetsService;

  readonly #logger: ILogger;

  constructor(
    accountsRepository: AccountsRepository,
    transactionsService: TransactionsService,
    assetsService: AssetsService,
    logger: ILogger,
  ) {
    this.#accountsRepository = accountsRepository;
    this.#transactionsService = transactionsService;
    this.#assetsService = assetsService;
    this.#logger = createPrefixedLogger(logger, '[🧑 AccountsService]');
  }

  async getAll(): Promise<SolanaKeyringAccount[]> {
    return this.#accountsRepository.getAll();
  }

  async findById(id: string): Promise<SolanaKeyringAccount | null> {
    return this.#accountsRepository.findById(id);
  }

  async findByAddress(address: string): Promise<SolanaKeyringAccount | null> {
    return this.#accountsRepository.findByAddress(address);
  }

  async synchronize(accounts?: SolanaKeyringAccount[]): Promise<void> {
    const accountsToSync = accounts ?? (await this.getAll());

    this.#logger.log('Synchronizing accounts', accountsToSync);

    try {
      const transactionsBefore =
        await this.#transactionsService.findByAccounts(accountsToSync);

      await this.#transactionsService
        .synchronize(accountsToSync)
        .catch((error) => {
          throw new CouldNotFetchTransactionsError(error);
        });

      const transactionsAfter =
        await this.#transactionsService.findByAccounts(accountsToSync);

      const diff = differenceBy(transactionsBefore, transactionsAfter, 'id');

      const accountIdsToRefresh = uniq(
        diff.map((transaction) => transaction.account),
      );

      const accountsToRefresh = accountsToSync.filter((account) =>
        accountIdsToRefresh.includes(account.id),
      );

      await this.#assetsService.refreshAssets(accountsToRefresh);
    } catch (error) {
      this.#logger.error('Error syncing accounts', error);

      if (error instanceof CouldNotFetchTransactionsError) {
        // Perform a full, refresh of the assets
        await this.#assetsService.refreshAssets(accountsToSync);
      } else {
        throw error;
      }
    }
  }
}
