import { KeyringEvent, type KeyringAccount } from '@metamask/keyring-api';
import { emitSnapKeyringEvent } from '@metamask/keyring-snap-sdk';

import type { EventEmitter } from '../../../infrastructure';
import { KnownCaip19Id, Network } from '../../constants/solana';
import type { ILogger } from '../../utils/logger';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';
import type {
  AccountMonitor,
  AccountMonitoringParams,
  AccountNotification,
} from '../subscriptions/AccountMonitor';

export class AccountsService {
  readonly #accountMonitor: AccountMonitor;

  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #logger: ILogger;

  readonly #loggerPrefix = '[🧑 AccountsService]';

  constructor(
    accountMonitor: AccountMonitor,
    state: IStateManager<UnencryptedStateValue>,
    eventEmitter: EventEmitter,
    logger: ILogger,
  ) {
    this.#accountMonitor = accountMonitor;
    this.#state = state;
    this.#logger = logger;

    eventEmitter.on('onStart', this.#monitorAllKeyringAccounts.bind(this));
  }

  async monitorKeyringAccount(account: KeyringAccount): Promise<void> {
    await this.#accountMonitor.monitor({
      address: account.address,
      commitment: 'confirmed',
      encoding: 'jsonParsed',
      network: Network.Mainnet,
      onAccountChanged: this.#handleAccountChanged.bind(this),
    });
  }

  async #monitorAllKeyringAccounts(): Promise<void> {
    this.#logger.info(this.#loggerPrefix, 'Monitoring all accounts');

    const accounts =
      (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
        'keyringAccounts',
      )) ?? {};

    await Promise.all(
      Object.values(accounts).map(async (account) => {
        await this.monitorKeyringAccount(account);
      }),
    );
  }

  async #handleAccountChanged(
    notification: AccountNotification<typeof params.encoding>,
    params: AccountMonitoringParams,
  ): Promise<void> {
    this.#logger.info(this.#loggerPrefix, 'Handling account changed event', {
      notification,
      params,
    });

    const { address } = params;
    const allAccounts =
      (await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
        'keyringAccounts',
      )) ?? {};
    const account = Object.values(allAccounts).find(
      (item) => item.address === address,
    );
    if (!account) {
      throw new Error('Account not found');
    }

    const lamports = notification.value?.lamports;
    if (!lamports) {
      this.#logger.error(
        this.#loggerPrefix,
        'No balance found in account changed event',
        {
          notification,
          params,
        },
      );
      return;
    }

    const balance = {
      amount: lamports.toString(),
      unit: 'SOL',
    };

    // Update the state
    await this.#state.setKey(
      `assets.${params.address}.${KnownCaip19Id.SolMainnet}`,
      balance,
    );

    // Notify the extension
    await emitSnapKeyringEvent(snap, KeyringEvent.AccountBalancesUpdated, {
      balances: {
        [account.id]: {
          [KnownCaip19Id.SolMainnet]: balance,
        },
      },
    });
  }
}
