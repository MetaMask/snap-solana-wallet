import { SolMethod } from '@metamask/keyring-api';
import { lamports } from '@solana/kit';

import type { AssetEntity, SolanaKeyringAccount } from '../../../entities';
import type { ICache } from '../../caching/ICache';
import { InMemoryCache } from '../../caching/InMemoryCache';
import {
  KnownCaip19Id,
  METAMASK_ORIGIN,
  Network,
  Networks,
} from '../../constants/solana';
import { ClientRequestMethod } from '../../handlers/onClientRequest/types';
import type { SolanaKeyring } from '../../handlers/onKeyringRequest/Keyring';
import { fromTransactionToBase64String } from '../../sdk-extensions/codecs';
import type { Serializable } from '../../serialization/types';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../test/mocks/solana-keyring-accounts';
import type { AssetsService } from '../assets';
import type { SolanaConnection } from '../connection';
import { mockLogger } from '../mocks/logger';
import { createMockConnection } from '../mocks/mockConnection';
import type { RecipientClassifier } from './RecipientClassifier';
import { SendService } from './SendService';
import type { SendSolBuilder } from './SendSolBuilder';
import type { SendSplTokenBuilder } from './SendSplTokenBuilder';
import { SendErrorCodes } from './types';
import type { OnAmountInputRequest, OnConfirmSendRequest } from './types';

// Mock dependencies
jest.mock('../../sdk-extensions/codecs');

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid'),
  },
});

jest.mock('@solana/kit', () => ({
  ...jest.requireActual('@solana/kit'),
  address: jest.requireActual('@solana/kit').address,
  lamports: jest.requireActual('@solana/kit').lamports,
  compileTransaction: jest.fn().mockReturnValue({
    message: {
      version: 0,
      header: {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      },
      staticAccounts: [],
      compiledInstructions: [],
      addressTableLookups: [],
    },
  }),
}));

describe('SendService', () => {
  let sendService: SendService;
  let mockConnection: SolanaConnection;
  let mockKeyring: SolanaKeyring;
  let mockCache: ICache<Serializable>;
  let mockSendSolBuilder: SendSolBuilder;
  let mockSendSplTokenBuilder: SendSplTokenBuilder;
  let mockAssetsService: AssetsService;
  let mockRecipientClassifier: RecipientClassifier;

  const mockAccount: SolanaKeyringAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = createMockConnection();
    mockCache = new InMemoryCache(mockLogger);

    jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
      getMinimumBalanceForRentExemption: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(lamports(1000000n)),
      }),
    } as any);

    mockKeyring = {
      getAccountOrThrow: jest.fn().mockResolvedValue(mockAccount),
      submitRequest: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as SolanaKeyring;

    mockRecipientClassifier = {
      classify: jest.fn().mockResolvedValue({ type: 'SYSTEM' }),
    } as unknown as RecipientClassifier;

    mockSendSolBuilder = {
      buildTransactionMessage: jest.fn().mockResolvedValue({} as any),
      getComputeUnitLimit: jest.fn().mockReturnValue(200000),
      getComputeUnitPriceMicroLamportsPerComputeUnit: jest
        .fn()
        .mockReturnValue(1000n),
    } as unknown as SendSolBuilder;

    mockSendSplTokenBuilder = {
      buildTransactionMessage: jest.fn().mockResolvedValue({} as any),
      getComputeUnitLimit: jest.fn().mockReturnValue(200000),
      getComputeUnitPriceMicroLamportsPerComputeUnit: jest
        .fn()
        .mockReturnValue(1000n),
    } as unknown as SendSplTokenBuilder;

    mockAssetsService = {
      findByAccount: jest.fn(),
    } as unknown as AssetsService;

    (fromTransactionToBase64String as jest.Mock).mockReturnValue(
      'base64-encoded-tx',
    );

    sendService = new SendService(
      mockConnection,
      mockKeyring,
      mockLogger,
      mockCache,
      mockRecipientClassifier,
      mockSendSolBuilder,
      mockSendSplTokenBuilder,
      mockAssetsService,
    );
  });

  describe('confirmSend', () => {
    const mockRequest: OnConfirmSendRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: ClientRequestMethod.ConfirmSend,
      params: {
        fromAccountId: mockAccount.id,
        toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        amount: '1.5',
        assetId: Networks[Network.Mainnet].nativeToken.caip19Id,
      },
    };

    it('confirms native SOL send transaction successfully', async () => {
      const result = await sendService.confirmSend(mockRequest);

      expect(mockKeyring.getAccountOrThrow).toHaveBeenCalledWith(
        mockAccount.id,
      );
      expect(mockSendSolBuilder.buildTransactionMessage).toHaveBeenCalledWith({
        from: mockAccount,
        to: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        amount: '1.5',
        network: Network.Mainnet,
      });
      expect(mockKeyring.submitRequest).toHaveBeenCalledWith({
        id: globalThis.crypto.randomUUID(),
        scope: Network.Mainnet,
        account: mockAccount.id,
        origin: METAMASK_ORIGIN,
        request: {
          method: SolMethod.SignAndSendTransaction,
          params: {
            account: { address: mockAccount.address },
            transaction: 'base64-encoded-tx',
            scope: Network.Mainnet,
          },
        },
      });
      expect(result).toStrictEqual({ success: true });
    });

    it('confirms SPL token send transaction successfully', async () => {
      const tokenRequest: OnConfirmSendRequest = {
        ...mockRequest,
        params: {
          ...mockRequest.params,
          assetId: KnownCaip19Id.UsdcMainnet,
        },
      };

      const result = await sendService.confirmSend(tokenRequest);

      expect(
        mockSendSplTokenBuilder.buildTransactionMessage,
      ).toHaveBeenCalledWith({
        from: mockAccount,
        to: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
        amount: '1.5',
        network: Network.Mainnet,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      });
      expect(result).toStrictEqual({ success: true });
    });

    it('handles errors from keyring.getAccountOrThrow', async () => {
      const error = new Error('Account not found');
      jest.spyOn(mockKeyring, 'getAccountOrThrow').mockRejectedValue(error);

      await expect(sendService.confirmSend(mockRequest)).rejects.toThrow(
        'Account not found',
      );
    });

    it('handles errors from builder.buildTransactionMessage', async () => {
      const error = new Error('Failed to build transaction');
      jest
        .spyOn(mockSendSolBuilder, 'buildTransactionMessage')
        .mockRejectedValue(error);

      await expect(sendService.confirmSend(mockRequest)).rejects.toThrow(
        'Failed to build transaction',
      );
    });

    it('handles errors from keyring.submitRequest', async () => {
      const error = new Error('Failed to submit request');
      jest.spyOn(mockKeyring, 'submitRequest').mockRejectedValue(error);

      await expect(sendService.confirmSend(mockRequest)).rejects.toThrow(
        'Failed to submit request',
      );
    });
  });

  describe('onAddressInput', () => {
    it('validates valid address successfully', async () => {
      const value = MOCK_SOLANA_KEYRING_ACCOUNT_1.address;
      const scope = Network.Mainnet;

      const result = await sendService.onAddressInput(value, scope);

      expect(result.valid).toBe(true);
      expect(result.errors).toStrictEqual([]);
    });

    it('rejects empty address', async () => {
      const value = '';
      const scope = Network.Mainnet;

      const result = await sendService.onAddressInput(value, scope);

      expect(result.valid).toBe(false);
      expect(result.errors).toStrictEqual([{ code: SendErrorCodes.Required }]);
    });

    it('rejects invalid address', async () => {
      const value = 'invalid-address';
      const scope = Network.Mainnet;

      const result = await sendService.onAddressInput(value, scope);

      expect(result.valid).toBe(false);
      expect(result.errors).toStrictEqual([{ code: SendErrorCodes.Invalid }]);
    });

    it('handles null/undefined address', async () => {
      const value = null as any;
      const scope = Network.Mainnet;

      const result = await sendService.onAddressInput(value, scope);

      expect(result.valid).toBe(false);
      expect(result.errors).toStrictEqual([{ code: SendErrorCodes.Invalid }]);
    });
  });

  describe('onAmountInput', () => {
    const mockRequest: OnAmountInputRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: ClientRequestMethod.OnAmountInput,
      params: {
        value: '1.5',
        accountId: mockAccount.id,
        assetId: Networks[Network.Mainnet].nativeToken.caip19Id,
      },
    };

    const mockAssetBalances: AssetEntity[] = [
      {
        assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
        uiAmount: '10.0',
        keyringAccountId: mockAccount.id,
        network: Network.Mainnet,
        address: mockAccount.address,
        symbol: Networks[Network.Mainnet].nativeToken.symbol,
        decimals: Networks[Network.Mainnet].nativeToken.decimals,
        rawAmount: '10000000000',
      },
    ];

    beforeEach(() => {
      jest
        .spyOn(mockAssetsService, 'findByAccount')
        .mockResolvedValue(mockAssetBalances);

      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getMinimumBalanceForRentExemption: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue(lamports(1000000n)),
        }),
      } as any);
    });

    it('validates valid native SOL amount successfully', async () => {
      const result = await sendService.onAmountInput(mockRequest);

      expect(result).toStrictEqual({
        valid: true,
        errors: [],
      });
    });

    it('rejects empty amount', async () => {
      const emptyRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: { ...mockRequest.params, value: '' },
      };

      const result = await sendService.onAmountInput(emptyRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.Required }],
      });
    });

    it('rejects when asset balance not found', async () => {
      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([]);

      await expect(sendService.onAmountInput(mockRequest)).rejects.toThrow(
        `Balance not found for asset ${mockRequest.params.assetId} and account ${mockAccount.id}`,
      );
    });

    it('rejects when native SOL balance is insufficient for rent exemption', async () => {
      const lowBalanceRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: { ...mockRequest.params, value: '0.000001' },
      };

      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        {
          assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
          uiAmount: '0.00001',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          address: mockAccount.address,
          symbol: Networks[Network.Mainnet].nativeToken.symbol,
          decimals: Networks[Network.Mainnet].nativeToken.decimals,
          rawAmount: '999999999999999999',
        },
      ]);

      const result = await sendService.onAmountInput(lowBalanceRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalanceToCoverFee }],
      });
    });

    it('rejects when native SOL amount exceeds balance', async () => {
      const highAmountRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: { ...mockRequest.params, value: '15.0' }, // More than 10.0 balance
      };

      const result = await sendService.onAmountInput(highAmountRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalance }],
      });
    });

    it('rejects when native SOL amount within balance but insufficient for fees and rent', async () => {
      const highAmountRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: { ...mockRequest.params, value: '9.999999999' },
      };

      const result = await sendService.onAmountInput(highAmountRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalanceToCoverFee }],
      });
    });

    it('rejects when value is greater than asset balance', async () => {
      const zeroBalanceRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: {
          ...mockRequest.params,
          assetId: KnownCaip19Id.UsdcMainnet,
          value: '0.1',
        },
      };

      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        {
          assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
          uiAmount: '0.1',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          address: mockAccount.address,
          symbol: Networks[Network.Mainnet].nativeToken.symbol,
          decimals: Networks[Network.Mainnet].nativeToken.decimals,
          rawAmount: '10000000000',
        },
        {
          assetType: KnownCaip19Id.UsdcMainnet,
          uiAmount: '0.001',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          mint: 'token-address-123',
          pubkey: 'token-address-123',
          symbol: 'USDC',
          decimals: 6,
          rawAmount: '1000000',
        },
      ]);

      const result = await sendService.onAmountInput(zeroBalanceRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalance }],
      });
    });

    it('rejects when native SOL balance is zero', async () => {
      const zeroSolRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: { ...mockRequest.params, value: '0.1' },
      };

      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        {
          assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
          uiAmount: '0',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          address: mockAccount.address,
          symbol: Networks[Network.Mainnet].nativeToken.symbol,
          decimals: Networks[Network.Mainnet].nativeToken.decimals,
          rawAmount: '0',
        },
      ]);

      const result = await sendService.onAmountInput(zeroSolRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalance }],
      });
    });

    it('validates SPL token amount successfully', async () => {
      const tokenRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: {
          ...mockRequest.params,
          assetId: KnownCaip19Id.UsdcMainnet,
        },
      };

      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        {
          assetType: KnownCaip19Id.UsdcMainnet,
          uiAmount: '100.0',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          mint: 'token-address-123',
          pubkey: 'token-address-123',
          symbol: 'USDC',
          decimals: 6,
          rawAmount: '100000000000',
        },
        {
          assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
          uiAmount: '1.0',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          address: mockAccount.address,
          symbol: Networks[Network.Mainnet].nativeToken.symbol,
          decimals: Networks[Network.Mainnet].nativeToken.decimals,
          rawAmount: '10000000000',
        },
      ]);

      const result = await sendService.onAmountInput(tokenRequest);

      expect(result).toStrictEqual({
        valid: true,
        errors: [],
      });
    });

    it('rejects SPL token when SOL balance is insufficient for fee and rent', async () => {
      const tokenRequest: OnAmountInputRequest = {
        ...mockRequest,
        params: {
          ...mockRequest.params,
          assetId: KnownCaip19Id.UsdcMainnet,
        },
      };

      jest.spyOn(mockAssetsService, 'findByAccount').mockResolvedValue([
        {
          assetType: KnownCaip19Id.UsdcMainnet,
          uiAmount: '100.0',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          mint: 'token-address-123',
          pubkey: 'token-address-123',
          symbol: 'USDC',
          decimals: 6,
          rawAmount: '100000000000',
        },
        {
          assetType: Networks[Network.Mainnet].nativeToken.caip19Id,
          uiAmount: '0.0001',
          keyringAccountId: mockAccount.id,
          network: Network.Mainnet,
          address: mockAccount.address,
          symbol: Networks[Network.Mainnet].nativeToken.symbol,
          decimals: Networks[Network.Mainnet].nativeToken.decimals,
          rawAmount: '10000000000',
        },
      ]);

      const result = await sendService.onAmountInput(tokenRequest);

      expect(result).toStrictEqual({
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalanceToCoverFee }],
      });
    });

    it('handles errors if account is not found', async () => {
      const error = new Error('Account not found');
      jest.spyOn(mockKeyring, 'getAccountOrThrow').mockRejectedValue(error);

      await expect(sendService.onAmountInput(mockRequest)).rejects.toThrow(
        'Account not found',
      );
    });

    it('handles errors if balances are not found', async () => {
      const error = new Error('Failed to fetch balances');
      jest.spyOn(mockAssetsService, 'findByAccount').mockRejectedValue(error);

      await expect(sendService.onAmountInput(mockRequest)).rejects.toThrow(
        'Failed to fetch balances',
      );
    });

    it('handles errors if connection fails', async () => {
      const error = new Error('RPC connection failed');
      jest.spyOn(mockConnection, 'getRpc').mockReturnValue({
        getMinimumBalanceForRentExemption: jest.fn().mockReturnValue({
          send: jest.fn().mockRejectedValue(error),
        }),
      } as any);

      await expect(sendService.onAmountInput(mockRequest)).rejects.toThrow(
        'RPC connection failed',
      );
    });
  });
});
