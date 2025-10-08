import type { SolanaKeyringAccount } from '../../../entities';
import type { AccountsRepository } from './AccountsRepository';

export class AccountsService {
  readonly #accountsRepository: AccountsRepository;

  constructor(accountsRepository: AccountsRepository) {
    this.#accountsRepository = accountsRepository;
  }

  async getAll(): Promise<SolanaKeyringAccount[]> {
    return this.#accountsRepository.getAll();
  }

  async getAllSelected(): Promise<SolanaKeyringAccount[]> {
    // TODO: Stub implementation. Replace with code commented out below once snap_manageAccounts is supported.
    const allAccounts = await this.#accountsRepository.getAll();
    return allAccounts.slice(0, 1);

    // TODO: Uncomment this once snap_manageAccounts is supported.
    // const [allAccounts, selectedAccountIds] = await Promise.all([
    //   this.#accountsRepository.getAll(),
    //   snap.request({
    //     method: 'snap_manageAccounts',
    //     params: {
    //       operation: 'getSelectedAccounts',
    //     },
    //   }),
    // ]);

    // return allAccounts.filter((account) =>
    //   (selectedAccountIds as string[]).includes(account.id),
    // );
  }

  async findById(id: string): Promise<SolanaKeyringAccount | null> {
    return this.#accountsRepository.findById(id);
  }

  async findByAddress(address: string): Promise<SolanaKeyringAccount | null> {
    return this.#accountsRepository.findByAddress(address);
  }

  async save(account: SolanaKeyringAccount): Promise<void> {
    return this.#accountsRepository.save(account);
  }

  async delete(id: string): Promise<void> {
    return this.#accountsRepository.delete(id);
  }
}
