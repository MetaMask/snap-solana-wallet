import type { CompilableTransactionMessage } from '@solana/kit';

import type { Network } from '../../../../constants/solana';
import type { SolanaKeyringAccount } from '../../../../domain';

export type MockExecutionScenario = {
  name: string;
  scope: Network;
  fromAccount: SolanaKeyringAccount;
  toAccount: SolanaKeyringAccount;
  fromAccountPrivateKeyBytes: Uint8Array;
  transactionMessage: CompilableTransactionMessage;
  transactionMessageBase64Encoded: string;
  signedTransaction: any;
  signedTransactionBase64Encoded: string;
  signature: string;
  /* The mock response from the getMultipleAccounts RPC call */
  getMultipleAccountsResponse?:
    | {
        result: object;
      }
    | undefined;
};
