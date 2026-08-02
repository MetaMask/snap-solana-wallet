import type { SolanaKeyringAccount } from '../../../entities';
import { createPrefixedLogger } from '../../utils/logger';
import type { ILogger } from '../../utils/logger';
import type { AssetsService } from '../assets/AssetsService';
import type { TransactionsService } from '../transactions';
import type { AccountsService } from './AccountsService';

export class AccountsSynchronizer {
  readonly #accountsService: AccountsService;

  readonly #assetsService: AssetsService;

  readonly #transactionsService: TransactionsService;

  readonly #logger: ILogger;

  constructor(
    accountsService: AccountsService,
    assetsService: AssetsService,
    transactionsService: TransactionsService,
    logger: ILogger,
  ) {
    this.#accountsService = accountsService;
    this.#assetsService = assetsService;
    this.#transactionsService = transactionsService;
    this.#logger = createPrefixedLogger(logger, '[🔄 AccountsSynchronizer]');
  }

  async synchronize(accounts?: SolanaKeyringAccount[]): Promise<void> {
    const accountsToSync = accounts ?? (await this.#accountsService.getAll());

    this.#logger.info('Synchronizing accounts', accountsToSync);

    const assets = (
      await Promise.allSettled(
        accountsToSync.map(async (account) => {
          if (
            await this.#assetsService.shouldTrackSnapAssetsForAccount(
              account.id,
            )
          ) {
            const fetchedAssets = await this.#assetsService.fetch(account);
            await this.#assetsService.saveMany(fetchedAssets);
            return fetchedAssets;
          }

          return this.#assetsService.getAccountAssetsForAllActiveScopes(
            account.id,
          );
        }),
      )
    )
      .map((item) => (item.status === 'fulfilled' ? item.value : []))
      .flat();

    const transactions =
      await this.#transactionsService.fetchAssetsTransactions(assets, {
        limit: 20,
      });

    await this.#transactionsService.saveMany(transactions);
  }
}
