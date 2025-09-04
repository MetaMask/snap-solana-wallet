import { address as asAddress } from '@solana/kit';

import { KnownCaip19Id, Network, Networks } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import { EXPECTED_FAILED_SWAP_DATA } from '../../test/mocks/transactions-data/failed-swap';
import { EXPECTED_NATIVE_SOL_TRANSFER_DATA } from '../../test/mocks/transactions-data/native-sol-transfer';
import { EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA } from '../../test/mocks/transactions-data/native-sol-transfer-to-self';
import { EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA } from '../../test/mocks/transactions-data/send-jup-transfer-checked-to-self';
import { SEND_PLONK_TO_SELF } from '../../test/mocks/transactions-data/send-plonk-to-self';
import { EXPECTED_SEND_SPL_TOKEN_AND_CREATE_TOKEN_ACCOUNT_DATA } from '../../test/mocks/transactions-data/send-spl-token-and-create-token-account';
import { EXPECTED_SEND_USDC_TRANSFER_DATA } from '../../test/mocks/transactions-data/send-usdc-transfer';
import { EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA } from '../../test/mocks/transactions-data/send-usdc-transfer-to-self';
import { EXPECTED_SEND_USDC_TRANSFER_TO_SELF_2_DATA } from '../../test/mocks/transactions-data/send-usdc-transfer-to-self-2';
import { EXPECTED_SWAP_A16Z_USDT_SOL_DATA } from '../../test/mocks/transactions-data/swap-a16z-usdt-sol';
import { EXPECTED_SWAP_SOL_TO_OBRIC_DATA } from '../../test/mocks/transactions-data/swap-sol-to-obric';
import { EXPECTED_SWAP_SOL_TO_SAHUR_DATA } from '../../test/mocks/transactions-data/swap-sol-to-sahur';
import { EXPECTED_SWAP_SOL_TO_USDC_DATA } from '../../test/mocks/transactions-data/swap-sol-to-usdc';
import { EXPECTED_SWAP_TRUMP_TO_JUP_DATA } from '../../test/mocks/transactions-data/swap-trump-to-jup';
import { EXPECTED_SWAP_USDC_TO_COBIE_DATA } from '../../test/mocks/transactions-data/swap-usdc-to-cobie';
import { EXPECTED_SWAP_USDC_TO_JUP_DATA } from '../../test/mocks/transactions-data/swap-usdc-to-jup';
import type { SolanaTransaction } from '../../types/solana';
import logger from '../../utils/logger';
import type { AssetsService, TokenHelper } from '../assets';
import { TransactionMapper } from './TransactionMapper';

describe('TransactionMapper', () => {
  let transactionMapper: TransactionMapper;
  let mockTokenHelper: TokenHelper;
  let mockAssetsService: AssetsService;
  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

  beforeEach(() => {
    jest.resetAllMocks();

    mockTokenHelper = {
      amountToUiAmountForMint: jest.fn().mockResolvedValue('1'),
    } as unknown as TokenHelper;

    mockAssetsService = {
      getAssetsMetadata: jest.fn().mockResolvedValue({}),
    } as unknown as AssetsService;

    transactionMapper = new TransactionMapper(
      mockTokenHelper,
      mockAssetsService,
      logger,
    );
  });

  describe('mapRpcTransaction', () => {
    it('maps native SOL transfers - as a sender', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_NATIVE_SOL_TRANSFER_DATA,
        mockAccount,
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736500242,
        chain: Network.Mainnet,
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        to: [
          {
            address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'confirmed',
            timestamp: 1736500242,
          },
        ],
      });
    });

    it('maps native SOL transfers - as a sender to self', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_NATIVE_SOL_TRANSFER_TO_SELF_DATA,
        mockAccount,
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '4Ccb8PaSob6JjsyDnoFJfUpJZDJHTwcjnK7MxiyVeMtPSsBGKuaMHEVL1VsXTKWS4w26tAhbc3T78aNELjfN8Zwb',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1741791493,
        chain: Network.Mainnet,
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        to: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'confirmed',
            timestamp: 1741791493,
          },
        ],
      });
    });

    it('maps native SOL transfers - as a receiver', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_NATIVE_SOL_TRANSFER_DATA,
        {
          ...mockAccount,
          address: asAddress('FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736500242,
        chain: Network.Mainnet,
        status: 'confirmed',
        type: 'receive',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        to: [
          {
            address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.1',
            },
          },
        ],
        fees: [],
        events: [
          {
            status: 'confirmed',
            timestamp: 1736500242,
          },
        ],
      });
    });

    it('maps native SOL transfers - failure', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        {
          ...EXPECTED_NATIVE_SOL_TRANSFER_DATA,
          meta: {
            ...EXPECTED_NATIVE_SOL_TRANSFER_DATA.meta,
            // eslint-disable-next-line id-denylist
            err: {
              DuplicateInstruction: 1,
            },
            status: {
              Err: {
                DuplicateInstruction: 1,
              },
            },
          },
        },
        mockAccount,
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736500242,
        chain: Network.Mainnet,
        status: 'failed',
        type: 'unknown',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              amount: '0.1',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        to: [
          {
            address: 'FDUGdV6bjhvw5gbirXCvqbTSWK9999kcrZcrHoCQzXJK',
            asset: {
              amount: '0.1',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'failed',
            timestamp: 1736500242,
          },
        ],
      });
    });

    it('maps SPL token transfers - as a sender', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValue('0.01');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_DATA,
        mockAccount,
        Network.Devnet,
      );

      expect(result).toStrictEqual({
        id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736502537,
        chain: Network.Devnet,
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '0.01',
            },
          },
        ],
        to: [
          {
            address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '0.01',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Devnet].nativeToken.caip19Id,
              unit: Networks[Network.Devnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'confirmed',
            timestamp: 1736502537,
          },
        ],
      });
    });

    it('maps SPL token transfers - as a sender to self', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA,
        mockAccount,
        Network.Devnet,
      );

      expect(result).toStrictEqual({
        id: 'fFSAjDzu7CdhzVUUC7DMKf7xuuVn8cZ8njPnpjkTBMHo4Y43SZto2GDuy123yKDoTieihPfDHvBpysE7Eh9aPmH',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1741796354,
        chain: Network.Devnet,
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '1',
            },
          },
        ],
        to: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '1',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Devnet].nativeToken.caip19Id,
              unit: Networks[Network.Devnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'confirmed',
            timestamp: 1741796354,
          },
        ],
      });
    });

    it('maps SPL token transfers - as a sender to self II', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_TO_SELF_2_DATA,
        {
          ...mockAccount,
          address: asAddress('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        },
        Network.Devnet,
      );

      expect(result).toStrictEqual({
        id: 'LPaVYsnhx2q9yTeU7bf5vLESBdm6BYatMSdZqt6CYy8wcX5YFm6rNKZLXJqRA7jyq2w3nbEqfB4qgCFSGS1L6GT',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1747059490,
        chain: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              unit: '',
              amount: '1',
            },
          },
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              amount: '0.00203928',
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        to: [
          {
            address: '9fE6zKgca6K2EEa3yjbcq7zGMusUNqSQeWQNL2YDZ2Yi',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              unit: '',
              amount: '1',
            },
          },
          {
            address: 'FrbudWWrsiv5deKG483U91njmeFPV45s3DQUfjhDD2BZ',
            asset: {
              amount: '0.00203928',
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
              unit: 'SOL',
              amount: '0.00000027',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1747059490 }],
      });
    });

    it('maps SPL token transfers - as a receiver', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValue('0.01');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_DATA,
        {
          ...mockAccount,
          address: asAddress('BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe'),
        },
        Network.Devnet,
      );

      expect(result).toStrictEqual({
        id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736502537,
        chain: Network.Devnet,
        status: 'confirmed',
        type: 'receive',
        from: [
          {
            address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '0.01',
            },
          },
        ],
        to: [
          {
            address: 'BXT1K8kzYXWMi6ihg7m9UqiHW4iJbJ69zumELHE9oBLe',
            asset: {
              fungible: true,
              type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
              unit: '',
              amount: '0.01',
            },
          },
        ],
        fees: [],
        events: [
          {
            status: 'confirmed',
            timestamp: 1736502537,
          },
        ],
      });
    });

    it('maps SPL token transfers - using TransferChecked', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_JUP_TRANSFER_CHECKED_DATA,
        {
          ...mockAccount,
          address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '4zvFGpqjihSXgHdw6ymHA8hVfyHURNPwASz4FS4c9wADCMSooojx8k42EUuhoDiGGM73SixUcNXafgnuM5dnKHfH',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1742387710,
        chain: Network.Mainnet,
        status: 'confirmed',
        type: 'send',
        from: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
              unit: '',
              amount: '1',
            },
          },
        ],
        to: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
              unit: '',
              amount: '1',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000075001',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1742387710 }],
      });
    });

    it('maps SPL token transfers - where sender has his token account created', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValue('0.01');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_SPL_TOKEN_AND_CREATE_TOKEN_ACCOUNT_DATA,
        {
          ...mockAccount,
          address: asAddress('BYh4CfuGDvFMKaZp3RPmkw9y6qg3sWukA2TiGJDeLKZi'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '4G24SgaZ3gU92HAB8xwSVg6WXS7NcGtUpHMnQ5RTwBw9bG5x8y6co5TzqqPXbExovY2NAuPjE9393TCHFZVhS8K9',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1745927033,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'receive',
        from: [
          {
            address: 'EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
              unit: '',
              amount: '0.01',
            },
          },
          {
            address: 'EMmTjuHsYCYX7vgPcQ2QVbNwYAwcvGoSMCEaHKc19DdE',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.00207408',
            },
          },
        ],
        to: [
          {
            address: 'BYh4CfuGDvFMKaZp3RPmkw9y6qg3sWukA2TiGJDeLKZi',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
              unit: '',
              amount: '0.01',
            },
          },
        ],
        fees: [],
        events: [{ status: 'confirmed', timestamp: 1745927033 }],
      });
    });

    it.todo('maps SPL token transfers - failure');

    it('maps swaps - #1 USDC -> Cobie', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('0.01')
        .mockResolvedValueOnce('12345') // any value, it's not used
        .mockResolvedValueOnce('2583.728601');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_USDC_TO_COBIE_DATA,
        {
          ...mockAccount,
          address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        },
        Network.Mainnet,
      );

      /**
       * Mainnet - Swap
       * Transaction: 2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11
       *
       * Fee Payer:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.000074798 SOL
       *
       * Senders:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 0.01 USDC
       *
       * Receivers:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2583.728601 Cobie
       */
      expect(result).toStrictEqual({
        id: '2pfnv4drhnitfzCFKxiRoJMzFQpG7wZ9mpRQVk7xm5TQ27g6FZH95HVF6KgwQBS872yGtyhuq57jXXS1y29ub11',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1740480781,
        chain: Network.Mainnet,
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: `${Network.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
              unit: '',
              amount: '0.01',
            },
          },
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              amount: '0.000000008',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        to: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: `${Network.Mainnet}/token:HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump`,
              unit: '',
              amount: '2583.728601',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: Networks[Network.Mainnet].nativeToken.caip19Id,
              unit: Networks[Network.Mainnet].nativeToken.symbol,
              amount: '0.000069798',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1740480781 }],
      });
    });

    it('maps swaps - #2 USDC -> JUP', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('1.1')
        .mockResolvedValueOnce('2.143812');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_USDC_TO_JUP_DATA,
        {
          ...mockAccount,
          address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        },
        Network.Mainnet,
      );

      /**
       * Mainnet - Swap
       * Transaction: 5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh
       *
       * Fee Payer:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa pays 0.00008 SOL
       *
       * Senders:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa sends 1.1 USDC
       *
       * Receivers:
       * DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa gets 2.143812 JUP
       */
      expect(result).toStrictEqual({
        id: '5LuTa5k9UvgM2eJknVUD9MjfcmcTP7nvFrCedU8d7ZLXCHbrrwqhXDQYTSfncm1wTSNFPZj3Y4cRkWC8CLG6Zcvh',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1742297902,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              unit: '',
              amount: '1.1',
            },
          },
        ],
        to: [
          {
            address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
              unit: '',
              amount: '2.143812',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000075001',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1742297902 }],
      });
    });

    it('maps swaps - #3 A16Z -> USDT -> SOL', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('1234') // any value, it's not used
        .mockResolvedValueOnce('1234') // any value, it's not used
        .mockResolvedValueOnce('1234') // any value, it's not used
        .mockResolvedValueOnce('0.000028168')
        .mockResolvedValueOnce('0.021898077');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_A16Z_USDT_SOL_DATA,
        {
          ...mockAccount,
          address: asAddress('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: 'JiqYGkWcYu8GxPZsMdXDnA8tkZvHnHVmNuKr4JYBErm4rgQWssdHCkbe8MzwwNGndyvyNYaaY5vvMhUMPNiQX9u',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1745425114,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
              unit: '',
              amount: '0.021898077',
            },
          },
        ],
        to: [
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000028168',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000017342',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1745425114 }],
      });
    });

    it('maps swaps - #4 TRUMP -> USDC -> WSOL -> JUP', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('0.000437')
        .mockResolvedValueOnce('0.05')
        .mockResolvedValueOnce('1.265445')
        .mockResolvedValueOnce('0.003679489')
        .mockResolvedValueOnce('0.543506')
        .mockResolvedValueOnce('0.049563')
        .mockResolvedValueOnce('0.543506')
        .mockResolvedValueOnce('0.003679489')
        .mockResolvedValueOnce('1.265445');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_TRUMP_TO_JUP_DATA,
        {
          ...mockAccount,
          address: asAddress('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '4VhDRLUK5QDZ6kgN9PCeEoztUraCibwYA3XaLZUKhfwWxqeN96Qg7Ep4w2j5C1VtggbuU6dqkGczGC537byu9hG3',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1746657467,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: '8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              unit: '',
              amount: '0.05',
            },
          },
          {
            address: '8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5',
            asset: {
              amount: '0.00203928',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        to: [
          {
            address: '8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
              unit: '',
              amount: '1.265445',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000036876',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1746657467 }],
      });
    });

    it('maps swaps - #5 SOL -> Sahur, uses swap balance to swap as well as create ATA', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('4036.960523')
        .mockResolvedValueOnce('0.01')
        .mockResolvedValueOnce('4036.960523')
        .mockResolvedValueOnce('4036.960523');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_SOL_TO_SAHUR_DATA,
        {
          ...mockAccount,
          address: asAddress('FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: 'QfFVu1P4ji8EFTor4BcRYS84wipv2RJDhyzi3w3YQgv1D8mxz2RhF9cKxi4k6DZdtzDRPL6a346HboDUAsSUCfV',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1747062836,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.01203928',
            },
          },
        ],
        to: [
          {
            address: 'FQT9SSwEZ6UUQxsmTzgt5JzjrS4M5zm13M1QiYF8TEo6',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:DNrmDMs2czDaAwgzg2BmvM7Jn5ZqA6VN5huRqCrSpump',
              unit: '',
              amount: '4036.960523',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000006785',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1747062836 }],
      });
    });

    // TODO: An interesting edge case that our current mapping logic doesn't handle well
    // We end this transaction with more of all assets than we started with meaning
    // we think it's a receive transaction but it's not, it's actually a Swap.
    // https://solscan.io/tx/2m8z8uPZyoZwQpissDbhSfW5XDTFmpc7cSFithc5e1w8iCwFcvVkxHeaVhgFSdgUPb5cebbKGjuu48JMLPjfEATr
    it.skip('maps swaps - #6 SOL -> USDC', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('0.167225')
        .mockResolvedValueOnce('0.00099125')
        .mockResolvedValueOnce('0.167225');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_SOL_TO_USDC_DATA,
        {
          ...mockAccount,
          address: asAddress('3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '2X4vKsDS56avumw6jh6Z5wj28GNvK5UkMfY1Ta2Mtouic886EGAraa1gsCJ5rkXyHCeL9p2wHRty3QHAhjf352Dp',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1748539118,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.00099125',
            },
          },
        ],
        to: [
          {
            address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              unit: '',
              amount: '0.167225',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000010072',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1748539118 }],
      });
    });

    it.skip('maps swaps - #7 SOL -> OBRIC', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValueOnce('4')
        .mockResolvedValueOnce('0.00875')
        .mockResolvedValueOnce('0.005903984')
        .mockResolvedValueOnce('0.99125');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_SOL_TO_OBRIC_DATA,
        {
          ...mockAccount,
          address: asAddress('3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1748545222,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'confirmed',
        type: 'swap',
        from: [
          {
            address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              unit: 'SOL',
              amount: '0.99125',
            },
          },
        ],
        to: [
          {
            address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: '',
              amount: '0.005903984',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.00001212',
            },
          },
        ],
        events: [{ status: 'confirmed', timestamp: 1748545222 }],
      });
    });

    it('maps swaps - failure', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_FAILED_SWAP_DATA,
        {
          ...mockAccount,
          address: asAddress('8VCfQcnssNJznDqDoDDuzoKhdxgZWwwe5ikcKbAVWet5'),
        },
        Network.Mainnet,
      );

      expect(result).toStrictEqual({
        id: '43VK3TtYjN21VG13f2EPvNJxmML38GB8QbTDVtFifzeDW3LQpmLtFdLjERAKwy3k4RUe4Hizmdrj4Nyjm5vYKDBx',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1747040326,
        chain: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        status: 'failed',
        type: 'unknown',
        from: [
          {
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            asset: {
              amount: '0.006',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        to: [
          {
            address: '34FKjAdVcTax2DHqV2XnbXa9J3zmyKcFuFKWbcmgxjgm',
            asset: {
              amount: '0',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
          {
            address: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
            asset: {
              amount: '0.0000525',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
          {
            address: '9QQjgi73MnaeeMvUYZr9LTaZj4dt3ktstUF8s25zfiJ1',
            asset: {
              amount: '0.0059475',
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
            },
          },
        ],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000005',
            },
          },
          {
            type: 'priority',
            asset: {
              fungible: true,
              type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
              unit: 'SOL',
              amount: '0.000515451',
            },
          },
        ],
        events: [{ status: 'failed', timestamp: 1747040326 }],
      });
    });

    it('returns null if the transaction has no signatures', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        {
          ...EXPECTED_NATIVE_SOL_TRANSFER_DATA,
          transaction: {
            ...EXPECTED_NATIVE_SOL_TRANSFER_DATA.transaction,
            signatures: [],
          },
        },
        mockAccount,
        Network.Mainnet,
      );

      expect(result).toBeNull();
    });

    it('parses empty token balances', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        {
          ...EXPECTED_SEND_USDC_TRANSFER_DATA,
          meta: {
            ...EXPECTED_SEND_USDC_TRANSFER_DATA.meta,
            preTokenBalances: [],
            postTokenBalances: [],
          } as SolanaTransaction['meta'],
        },
        mockAccount,
        Network.Devnet,
      );

      expect(result).toStrictEqual({
        id: '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        account: '4b445722-6766-4f99-ade5-c2c9295f21d0',
        timestamp: 1736502537,
        chain: Network.Devnet,
        status: 'confirmed',
        type: 'unknown',
        from: [],
        to: [],
        fees: [
          {
            type: 'base',
            asset: {
              fungible: true,
              type: Networks[Network.Devnet].nativeToken.caip19Id,
              unit: Networks[Network.Devnet].nativeToken.symbol,
              amount: '0.000005',
            },
          },
        ],
        events: [
          {
            status: 'confirmed',
            timestamp: 1736502537,
          },
        ],
      });
    });

    it('correctly parses a token send to self with Transfer instruction on token program', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_TO_SELF_DATA,
        mockAccount,
        Network.Devnet,
      );

      expect(result?.from).toStrictEqual([
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '1',
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
          },
        },
      ]);

      expect(result?.to).toStrictEqual([
        {
          address: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
          asset: {
            amount: '1',
            fungible: true,
            type: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            unit: '',
          },
        },
      ]);
    });

    it('correctly parses a token send to self with TransferChecked instruction on token2022 program', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        SEND_PLONK_TO_SELF,
        {
          ...mockAccount,
          address: asAddress('8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC'),
        },
        Network.Mainnet,
      );

      expect(result?.from).toStrictEqual([
        {
          address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
          asset: {
            amount: '36',
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:HeqCcMjmuV5s25J49YiJyT6bD5qWLkP88YPajBySniaV',
            unit: '',
          },
        },
      ]);

      expect(result?.to).toStrictEqual([
        {
          address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
          asset: {
            amount: '36',
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:HeqCcMjmuV5s25J49YiJyT6bD5qWLkP88YPajBySniaV',
            unit: '',
          },
        },
      ]);
    });
  });

  describe('fee parsing', () => {
    it('parses transaction fees on native solana transfers', async () => {
      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_NATIVE_SOL_TRANSFER_DATA,
        mockAccount,
        Network.Localnet,
      );

      expect(result?.fees).toStrictEqual([
        {
          asset: {
            amount: '0.000005',
            fungible: true,
            type: KnownCaip19Id.SolLocalnet,
            unit: 'SOL',
          },
          type: 'base',
        },
      ]);
    });

    it('parses transaction fees on SPL transfers', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValue('1');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SEND_USDC_TRANSFER_DATA,
        mockAccount,
        Network.Localnet,
      );

      expect(result?.fees).toStrictEqual([
        {
          asset: {
            amount: '0.000005',
            fungible: true,
            type: KnownCaip19Id.SolLocalnet,
            unit: 'SOL',
          },
          type: 'base',
        },
      ]);
    });

    it('parses transaction fees on swap transactions', async () => {
      jest
        .spyOn(mockTokenHelper, 'amountToUiAmountForMint')
        .mockResolvedValue('1');

      const result = await transactionMapper.mapRpcTransaction(
        EXPECTED_SWAP_USDC_TO_COBIE_DATA,
        {
          ...mockAccount,
          address: asAddress('DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa'),
        },
        Network.Mainnet,
      );

      expect(result?.fees).toStrictEqual([
        {
          type: 'base',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000005',
          },
        },
        {
          type: 'priority',
          asset: {
            fungible: true,
            type: Networks[Network.Mainnet].nativeToken.caip19Id,
            unit: Networks[Network.Mainnet].nativeToken.symbol,
            amount: '0.000069798',
          },
        },
      ]);
    });
  });

  describe('enhancement with assets metadata', () => {
    describe('when assets metadata is provided as argument', () => {
      it('maps transactions with assets metadata', async () => {
        const assetsMetadata = {
          [KnownCaip19Id.UsdcDevnet]: {
            fungible: true,
            iconUrl: '',
            units: [{ decimals: 6, symbol: 'USDC', name: 'USDC' }],
            symbol: 'USDC',
            name: 'USDC',
          },
        };

        const result = await transactionMapper.mapRpcTransaction(
          EXPECTED_SEND_USDC_TRANSFER_DATA,
          mockAccount,
          Network.Devnet,
          assetsMetadata,
        );

        expect(result).toMatchObject({
          from: [
            {
              asset: {
                unit: 'USDC',
              },
            },
          ],
          to: [
            {
              asset: {
                unit: 'USDC',
              },
            },
          ],
        });
      });
    });

    describe('when assets metadata is not provided as argument', () => {
      it('maps transactions with assets metadata fetched from the assets service', async () => {
        jest.spyOn(mockAssetsService, 'getAssetsMetadata').mockResolvedValue({
          [KnownCaip19Id.UsdcDevnet]: {
            fungible: true,
            iconUrl: '',
            units: [{ decimals: 6, symbol: 'USDC', name: 'USDC' }],
            symbol: 'USDC',
            name: 'USDC',
          },
        });

        const result = await transactionMapper.mapRpcTransaction(
          EXPECTED_SEND_USDC_TRANSFER_DATA,
          mockAccount,
          Network.Devnet,
        );

        expect(result).toMatchObject({
          from: [
            {
              asset: {
                unit: 'USDC',
              },
            },
          ],
          to: [
            {
              asset: {
                unit: 'USDC',
              },
            },
          ],
        });
      });
    });
  });
});
