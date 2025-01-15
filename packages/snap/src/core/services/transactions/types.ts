import type { Transaction } from '@metamask/keyring-api';

export type MappedTransaction = Omit<Transaction, 'account'>;
