import { transactionsService } from '../../../snapContext';
import type { SolanaConnection } from '../connection';
import { TransactionHelper } from '../transaction-helper/TransactionHelper';

describe('TransactionsService', () => {
  const mockRpcResponse = {
    send: jest.fn(),
  };

  const mockConnection = {
    getRpc: jest.fn().mockReturnValue({
      getSignaturesForAddress: () => mockGetSignaturesResponse,
      getTransaction: () => mockGetTransactionResponse,
    }),
  } as unknown as SolanaConnection;

  let transactionHelper: TransactionHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionHelper = new TransactionHelper(mockConnection, logger);
  });

  it('should fetch initial transactions', async () => {
    const transactions =
      await transactionsService.fetchInitialAddressTransactions('123');
  });
});
