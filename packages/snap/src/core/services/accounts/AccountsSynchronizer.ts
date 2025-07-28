import type { AssetEntity, SolanaKeyringAccount } from '../../../entities';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import { AssetsService } from '../assets/AssetsService';
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
        accountsToSync.map(async (account) =>
          this.#assetsService.fetch(account),
        ),
      )
    )
      .map((item) => (item.status === 'fulfilled' ? item.value : []))
      .flat();

    const savedAssets = await this.#assetsService.getAll();

    const hasChanged = (asset: AssetEntity) =>
      AssetsService.hasChanged(asset, savedAssets);

    const assetsThatChanged = assets.filter(hasChanged);

    await this.#assetsService.saveMany(assetsThatChanged);

    const transactions =
      await this.#transactionsService.fetchAssetsTransactions(
        assetsThatChanged,
      );

    await this.#transactionsService.saveMany(transactions);
  }
}
