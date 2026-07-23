import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '@solana-program/compute-budget';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-restricted-globals */
import { address as asAddress } from '@solana/kit';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import type { ILogger } from '../../utils/logger';
import type { TokenHelper } from '../assets/TokenHelper';
import type { SolanaConnection } from '../connection';
import { ApproveTokenService } from './ApproveTokenService';

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  createKeyPairSignerFromPrivateKeyBytes: jest.fn(),
}));

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
    jest.clearAllMocks();

    const { createKeyPairSignerFromPrivateKeyBytes } = require('@solana/kit');

    (createKeyPairSignerFromPrivateKeyBytes as jest.Mock).mockResolvedValue({
      address: asAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'),
      signMessages: jest.fn(),
      signTransactions: jest.fn(),
    });

    mockConnection = {
      fetchMint: jest.fn(),
      getLatestBlockhash: jest.fn(),
      fetchJsonParsedAccount: jest.fn(),
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

    mockConnection.fetchMint.mockResolvedValue({
      programAddress: TOKEN_PROGRAM_ADDRESS,
      data: { decimals: 6 },
    } as any);
    mockConnection.getLatestBlockhash.mockResolvedValue({
      blockhash: '9999999999999999999999999999999999999999999' as any,
      lastValidBlockHeight: 100n,
    });

    mockTokenHelper.uiAmountToAmountForMint.mockResolvedValue(
      100500000n as any,
    );

    // Default: ATA does not exist
    mockConnection.fetchJsonParsedAccount.mockResolvedValue({
      exists: false,
    } as any);

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
      expect(transactionMessage.instructions).toHaveLength(4); // SetComputeUnitPrice + Create ATA + Approve + SetComputeUnitLimit
    });

    it('builds instructions in the correct order: SetComputeUnitPrice, Create, Approve, SetComputeUnitLimit', async () => {
      const SET_COMPUTE_UNIT_PRICE_DISCRIMINANT = 3;
      const SET_COMPUTE_UNIT_LIMIT_DISCRIMINANT = 2;

      const { instructions } = await service.buildApprovalTransactionMessage({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '100.50',
        network: Network.Mainnet,
      });

      expect(instructions).toHaveLength(4);
      // First: SetComputeUnitPrice
      expect(instructions[0].programAddress).toBe(
        COMPUTE_BUDGET_PROGRAM_ADDRESS,
      );
      expect(instructions[0].data?.[0]).toBe(
        SET_COMPUTE_UNIT_PRICE_DISCRIMINANT,
      );
      // Second: Create ATA (token program)
      expect(instructions[1]?.programAddress).not.toBe(
        COMPUTE_BUDGET_PROGRAM_ADDRESS,
      );
      // Third: Approve (token program)
      expect(instructions[2]?.programAddress).not.toBe(
        COMPUTE_BUDGET_PROGRAM_ADDRESS,
      );
      // Last: SetComputeUnitLimit
      expect(instructions[3]?.programAddress).toBe(
        COMPUTE_BUDGET_PROGRAM_ADDRESS,
      );
      expect(instructions[3]?.data?.[0]).toBe(
        SET_COMPUTE_UNIT_LIMIT_DISCRIMINANT,
      );
    });

    it('omits the Create ATA instruction when the ATA already exists', async () => {
      mockConnection.fetchJsonParsedAccount.mockResolvedValue({
        exists: true,
        address: asAddress('11111111111111111111111111111111'),
        data: {},
        programAddress: TOKEN_PROGRAM_ADDRESS,
      } as any);

      const transactionMessage = await service.buildApprovalTransactionMessage({
        account: MOCK_SOLANA_KEYRING_ACCOUNT_0,
        mint: mockMint,
        delegate: mockDelegate,
        amount: '100.50',
        network: Network.Mainnet,
      });

      expect(transactionMessage).toHaveProperty('version', 0);
      expect(transactionMessage).toHaveProperty('instructions');
      expect(transactionMessage.instructions).toHaveLength(3); // SetComputeUnitPrice + Approve + SetComputeUnitLimit (no Create ATA)
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
