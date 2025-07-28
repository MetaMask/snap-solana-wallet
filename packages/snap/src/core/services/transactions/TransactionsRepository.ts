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
    // Optimize the sate operations by reading and writing to the state only once
    await this.#state.update((state) => {
      const allTransactionsByAccount = state[this.#stateKey];

      transactions.forEach((transaction) => {
        const signature = transaction.id;
        const accountId = transaction.account;
        const existingTransactionsForAccount =
          allTransactionsByAccount[accountId] ?? [];

        // Avoid duplicates. If a transaction with the same signature already exists, override it.
        const sameSignatureTransactionIndex =
          existingTransactionsForAccount.findIndex((tx) => tx.id === signature);

        if (sameSignatureTransactionIndex !== -1) {
          existingTransactionsForAccount[sameSignatureTransactionIndex] =
            transaction;
        }

        const updatedTransactions = chain([
          ...existingTransactionsForAccount,
          transaction,
        ])
          .uniqBy('id')
          .sortBy((item) => -(item.timestamp ?? 0)) // Sort by timestamp in descending order
          .value();

        state[this.#stateKey][accountId] = updatedTransactions;
      });

      return state;
    });
  }
}
