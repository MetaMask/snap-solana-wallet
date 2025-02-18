import type {
  CompilableTransactionMessage,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';

import type { Network } from '../../../../constants/solana';
import type { SolanaKeyringAccount } from '../../../keyring/Keyring';

export type MockExecutionScenario = {
  name: string;
  scope: Network;
  fromAccount: SolanaKeyringAccount;
  toAccount: SolanaKeyringAccount;
  fromAccountPrivateKeyBytes: Uint8Array;
  transactionMessage: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime;
  transactionMessageBase64Encoded: string;
  signedTransaction: any;
  signature: string;
  /* The mock response from the getMultipleAccounts RPC call */
  getMultipleAccountsResponse?:
    | {
        result: object;
      }
    | undefined;
};
