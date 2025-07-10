import type { SolanaKeyringAccount } from '../../../entities';
import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';

export class AccountService {
  readonly #state: IStateManager<UnencryptedStateValue>;

  constructor(state: IStateManager<UnencryptedStateValue>) {
    this.#state = state;
  }

  /**
   * Returns all accounts from the state.
   * @returns All accounts from the state.
   */
  async getAll(): Promise<SolanaKeyringAccount[]> {
    const accounts =
      await this.#state.getKey<UnencryptedStateValue['keyringAccounts']>(
        'keyringAccounts',
      );

    return Object.values(accounts ?? {});
  }
}
