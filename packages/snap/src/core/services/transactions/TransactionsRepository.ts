import type { Transaction } from '@metamask/keyring-api';
import { chain } from 'lodash';

import type { IStateManager } from '../state/IStateManager';
import type { UnencryptedStateValue } from '../state/State';

export class TransactionsRepository {
  readonly #state: IStateManager<UnencryptedStateValue>;

  readonly #stateKey = 'transactions';

  constructor(state: IStateManager<UnencryptedStateValue>) {
    this.#state = state;
  }

  async getAll(): Promise<Transaction[]> {
    const transactionsByAccount = await this.#state.getKey<
      UnencryptedStateValue['transactions']
    >(this.#stateKey);

    return Object.values(transactionsByAccount ?? {}).flat();
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const transactions = await this.#state.getKey<Transaction[]>(
      `${this.#stateKey}.${accountId}`,
    );

    return transactions ?? [];
  }

  async save(transaction: Transaction): Promise<void> {
    await this.saveMany([transaction]);
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    // Group transactions by account to minimize state operations
    const transactionsByAccount = transactions.reduce<
      Record<string, Transaction[]>
    >((acc, transaction) => {
      const accountId = transaction.account;
      if (!acc[accountId]) {
        acc[accountId] = [];
      }
      acc[accountId].push(transaction);
      return acc;
    }, {});

    // Update each account's transactions
    await Promise.all(
      Object.entries(transactionsByAccount).map(
        async ([accountId, newTransactions]) => {
          const existingTransactionsForAccount =
            (await this.#state.getKey<Transaction[]>(
              `${this.#stateKey}.${accountId}`,
            )) ?? [];

          // Put new transactions first so uniqBy keeps them (it keeps the first occurrence)
          const updatedTransactions = chain([
            ...newTransactions,
            ...existingTransactionsForAccount,
          ])
            .uniqBy('id')
            .sortBy((item) => -(item.timestamp ?? 0)) // Sort by timestamp in descending order
            .value();

          await this.#state.setKey(
            `${this.#stateKey}.${accountId}`,
            updatedTransactions,
          );
        },
      ),
    );
  }
}
