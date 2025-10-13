import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { Network } from '../../constants/solana';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { RecipientClassifier } from './RecipientClassifier';

// Mock the @solana/kit functions
jest.mock('@solana/kit', () => ({
  address: jest.fn(),
  assertAccountExists: jest.fn(),
  fetchJsonParsedAccount: jest.fn(),
}));

const {
  assertAccountExists,
  fetchJsonParsedAccount,
  address: asAddress,
} = jest.requireMock('@solana/kit');

describe('RecipientClassifier', () => {
  let classifier: RecipientClassifier;
  let mockConnection: SolanaConnection;
  let mockRpc: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRpc = {
      getAccountInfo: jest.fn(),
    };

    mockConnection = {
      getRpc: jest.fn().mockReturnValue(mockRpc),
    } as unknown as SolanaConnection;

    // Mock asAddress to return the input address
    asAddress.mockImplementation((address: string) => address);

    assertAccountExists.mockImplementation(() => {
      // No error
    });

    classifier = new RecipientClassifier(mockConnection, mockLogger);
  });

  describe('classify', () => {
    const recipientAddress = '9iWxPhaTyvUckBA3GqBaa8zfqeyT6UKokJs2MfimYgkr';
    const network = Network.Mainnet;

    it('classifies non-existent account as SYSTEM', async () => {
      const mockAccountInfo = null;

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);
      assertAccountExists.mockImplementation(() => {
        throw new Error('Account does not exist');
      });

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'SYSTEM' });
      expect(fetchJsonParsedAccount).toHaveBeenCalledWith(
        mockRpc,
        recipientAddress,
      );
    });

    it('classifies system program account as SYSTEM', async () => {
      const mockAccountInfo = {
        programAddress: SYSTEM_PROGRAM_ADDRESS,
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);
      assertAccountExists.mockImplementation(() => {
        throw new Error('Account does not exist');
      });

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'SYSTEM' });
    });

    it('classifies token program account as TOKEN_ACCOUNT', async () => {
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const ownerAddress = '9iWxPhaTyvUckBA3GqBaa8zfqeyT6UKokJs2MfimYgkr';

      const mockAccountInfo = {
        programAddress: TOKEN_PROGRAM_ADDRESS,
        data: {
          mint: mintAddress,
          owner: ownerAddress,
        },
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({
        type: 'TOKEN_ACCOUNT',
        mint: mintAddress,
      });
    });

    it('classifies token 2022 program account as TOKEN_ACCOUNT', async () => {
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const ownerAddress = '9iWxPhaTyvUckBA3GqBaa8zfqeyT6UKokJs2MfimYgkr';

      const mockAccountInfo = {
        programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        data: {
          mint: mintAddress,
          owner: ownerAddress,
        },
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({
        type: 'TOKEN_ACCOUNT',
        mint: mintAddress,
      });
    });

    it('classifies token account without mint as UNSUPPORTED', async () => {
      const ownerAddress = '9iWxPhaTyvUckBA3GqBaa8zfqeyT6UKokJs2MfimYgkr';

      const mockAccountInfo = {
        programAddress: TOKEN_PROGRAM_ADDRESS,
        data: {
          owner: ownerAddress,
          // mint is missing
        },
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'UNSUPPORTED' });
    });

    it('classifies token account without owner as UNSUPPORTED', async () => {
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      const mockAccountInfo = {
        programAddress: TOKEN_PROGRAM_ADDRESS,
        data: {
          mint: mintAddress,
          // owner is missing
        },
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'UNSUPPORTED' });
    });

    it('classifies mint account as UNSUPPORTED', async () => {
      const mockAccountInfo = {
        programAddress: TOKEN_PROGRAM_ADDRESS,
        data: {
          freezeAuthority: '7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar',
          isInitialized: true,
          mintAuthority: 'BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG',
          supply: '12807222010705262',
        },
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'UNSUPPORTED' });
    });

    it('classifies program account as UNSUPPORTED', async () => {
      const mockAccountInfo = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: {},
      };

      fetchJsonParsedAccount.mockResolvedValue(mockAccountInfo);

      const result = await classifier.classify(recipientAddress, network);

      expect(result).toStrictEqual({ type: 'UNSUPPORTED' });
    });
  });
});
