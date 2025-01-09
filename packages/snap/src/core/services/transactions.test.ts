import { Network, TokenMetadata } from '../constants/solana';
import type { ILogger } from '../utils/logger';
import type { SolanaConnection } from './connection';
import { TransactionsService } from './transactions';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let mockConnection: SolanaConnection;
  let mockLogger: ILogger;
  let mockRpc: any;

  beforeEach(() => {
    mockRpc = {
      getSignaturesForAddress: jest.fn().mockReturnValue({ send: jest.fn() }),
      getTransaction: jest.fn().mockReturnValue({ send: jest.fn() }),
    };

    mockConnection = {
      getRpc: jest.fn().mockReturnValue(mockRpc),
    } as unknown as SolanaConnection;

    mockLogger = {
      log: jest.fn(),
    } as unknown as ILogger;

    transactionsService = new TransactionsService({
      connection: mockConnection,
      logger: mockLogger,
    });
  });

  describe('fetchInitialAddressTransactions', () => {
    it('fetches transactions from both mainnet and devnet', async () => {
      const mockAddress = 'mockAddress';
      const mockTransactions = {
        data: [
          {
            id: 'tx1',
            type: 'transfer',
            status: 'confirmed',
            timestamp: 123456789,
            chain: 'solana:mainnet',
            from: [],
            to: [],
            fees: [],
            events: [],
          },
        ],
        next: null,
      };

      jest
        .spyOn(transactionsService, 'fetchAddressTransactions')
        .mockResolvedValue(mockTransactions);

      const result = await transactionsService.fetchInitialAddressTransactions(
        mockAddress,
      );

      expect(
        transactionsService.fetchAddressTransactions,
      ).toHaveBeenCalledTimes(2);
      expect(transactionsService.fetchAddressTransactions).toHaveBeenCalledWith(
        Network.Mainnet,
        mockAddress,
        { limit: 5 },
      );
      expect(transactionsService.fetchAddressTransactions).toHaveBeenCalledWith(
        Network.Devnet,
        mockAddress,
        { limit: 5 },
      );
      expect(result).toEqual([{ id: 'tx1' }, { id: 'tx1' }]);
    });
  });

  describe('fetchAddressTransactions', () => {
    it('fetches and maps transactions correctly', async () => {
      const mockAddress = 'mockAddress';
      const mockSignatures = [{ signature: 'sig1' }];
      const mockTransactionData = {
        transaction: {
          signatures: ['sig1'],
          message: {
            accountKeys: ['account1'],
          },
        },
        meta: {
          fee: '5000',
          preBalances: [1000000],
          postBalances: [990000],
          preTokenBalances: [],
          postTokenBalances: [],
        },
        blockTime: 1234567890,
      };

      mockRpc.getSignaturesForAddress.mockReturnValue({
        send: jest.fn().mockResolvedValue(mockSignatures),
      });

      mockRpc.getTransaction.mockReturnValue({
        send: jest.fn().mockResolvedValue(mockTransactionData),
      });

      const result = await transactionsService.fetchAddressTransactions(
        Network.Mainnet,
        mockAddress,
        { limit: 1 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'sig1',
        timestamp: 1234567890,
        chain: 'mainnet:solana',
        status: 'confirmed',
      });
    });
  });

  describe('parseTransactionNativeTransfers', () => {
    it('correctly parses native SOL transfers', () => {
      const mockTransactionData = {
        transaction: {
          message: {
            accountKeys: ['feePayer', 'sender', 'receiver'],
          },
        },
        meta: {
          fee: '5000',
          preBalances: [1000000, 2000000, 0],
          postBalances: [994000, 1000000, 1000000],
        },
      };

      const result = transactionsService.parseTransactionNativeTransfers({
        scope: Network.Mainnet,
        transactionData: mockTransactionData as any,
      });

      expect(result.fees).toHaveLength(1);
      expect(result.from).toHaveLength(2); // feePayer (fee) and sender
      expect(result.to).toHaveLength(1); // receiver
    });
  });

  describe('parseTransactionSplTransfers', () => {
    it('correctly parses SPL token transfers', () => {
      const mockMint = Object.keys(TokenMetadata)[0];
      const mockTransactionData = {
        meta: {
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: mockMint,
              owner: 'sender',
              uiTokenAmount: {
                amount: '1000000',
                decimals: 6,
              },
            },
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: mockMint,
              owner: 'sender',
              uiTokenAmount: {
                amount: '0',
                decimals: 6,
              },
            },
          ],
        },
      };

      const result = transactionsService.parseTransactionSplTransfers({
        scope: Network.Mainnet,
        transactionData: mockTransactionData as any,
      });

      expect(result.from).toHaveLength(1);
      expect(result.to).toHaveLength(0);
    });
  });
});
