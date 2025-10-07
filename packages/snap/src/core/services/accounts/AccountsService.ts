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

  async getSelected(): Promise<SolanaKeyringAccount | null> {
    // TODO: Implement this
    const allAccounts = await this.#accountsRepository.getAll();
    return allAccounts[0] ?? null;
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
