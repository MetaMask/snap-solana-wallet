import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import type { TokenHelper } from '../assets/TokenHelper';
import type { SolanaConnection } from '../connection';
import { ApproveTokenService } from './ApproveTokenService';

// Mock the deriveSolanaKeypair function
jest.mock('../../utils/deriveSolanaKeypair', () => ({
  deriveSolanaKeypair: jest.fn().mockResolvedValue({
    publicKeyBytes: new Uint8Array(32).fill(1),
    privateKeyBytes: new Uint8Array(32).fill(2),
  }),
}));

describe('ApproveTokenService', () => {
  let service: ApproveTokenService;
  let mockConnection: jest.Mocked<SolanaConnection>;
  let mockTokenHelper: jest.Mocked<TokenHelper>;
  let mockLogger: jest.Mocked<ILogger>;

  const mockMint = asAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const mockDelegate = asAddress(
    '4jepDb74FCMr1wgoSA34FeJ2mkvEsJBRZQQRumqp9EL3',
  );

  beforeEach(() => {
    mockConnection = {
      fetchMint: jest.fn(),
      getLatestBlockhash: jest.fn(),
    } as unknown as jest.Mocked<SolanaConnection>;

    mockTokenHelper = {
      uiAmountToAmountForMint: jest.fn(),
    } as unknown as jest.Mocked<TokenHelper>;

    mockLogger = {
      log: jest.fn(),
    } as unknown as jest.Mocked<ILogger>;

    service = new ApproveTokenService(
      mockConnection,
      mockTokenHelper,
      mockLogger,
    );

    // Mock the connection methods
    mockConnection.fetchMint.mockResolvedValue({
      programAddress: TOKEN_PROGRAM_ADDRESS,
      data: { decimals: 6 },
    } as any);
    mockConnection.getLatestBlockhash.mockResolvedValue({
      blockhash: '9999999999999999999999999999999999999999999' as any,
      lastValidBlockHeight: 100n,
    });

    // Mock the token helper
    mockTokenHelper.uiAmountToAmountForMint.mockResolvedValue(
      100500000n as any,
    );

    jest.clearAllMocks();
  });

  describe('buildApprovalTransactionMessage', () => {
    it('builds a valid token approval transaction message', async () => {
      const transactionMessage = await service.buildApprovalTransactionMessage({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '100.50',
        network: Network.Mainnet,
      });

      expect(mockConnection.fetchMint).toHaveBeenCalledWith(
        mockMint,
        Network.Mainnet,
      );
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalledWith(
        Network.Mainnet,
      );
      expect(mockTokenHelper.uiAmountToAmountForMint).toHaveBeenCalledWith(
        mockMint,
        Network.Mainnet,
        '100.50',
      );

      // Verify the transaction message structure
      expect(transactionMessage).toHaveProperty('version', 0);
      expect(transactionMessage).toHaveProperty('instructions');
      expect(transactionMessage.instructions).toHaveLength(4); // 2 compute budget + 1 create ATA idempotent + 1 approve
    });

    it('fetches mint info to get token program', async () => {
      await service.buildApprovalTransactionMessage({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '50',
        network: Network.Devnet,
      });

      expect(mockConnection.fetchMint).toHaveBeenCalledWith(
        mockMint,
        Network.Devnet,
      );
    });

    it('converts UI amount to raw token amount', async () => {
      await service.buildApprovalTransactionMessage({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '250.75',
        network: Network.Mainnet,
      });

      expect(mockTokenHelper.uiAmountToAmountForMint).toHaveBeenCalledWith(
        mockMint,
        Network.Mainnet,
        '250.75',
      );
    });
  });
});
