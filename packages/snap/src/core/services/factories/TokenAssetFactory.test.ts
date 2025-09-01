import type { FungibleAssetMetadata } from '@metamask/snaps-sdk';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import {
  address,
  lamports,
  stringifiedBigInt,
  stringifiedNumber,
} from '@solana/kit';

import type { ProgramNotification } from '../../../entities';
import { Network } from '../../constants/solana';
import type { TokenAccount } from '../../sdk-extensions/rpc-api';
import { TokenAssetFactory } from './TokenAssetFactory';

describe('TokenAssetFactory', () => {
  const createMockTokenAccount = (): TokenAccount => ({
    account: {
      data: {
        parsed: {
          info: {
            extensions: [
              {
                extension: 'immutableOwner',
              },
            ],
            isNative: false,
            mint: address('8ACxyJds7t1Tp6Qd8w2iNinVmPKr6oj3MnTqXKeQiNcn'),
            owner: address('ADxifRtus6xoELQzy9bupoHGBG8c1V8q7eMmoWN1QWUk'),
            state: 'initialized',
            tokenAmount: {
              amount: stringifiedBigInt('3500000000000'),
              decimals: 9,
              uiAmount: 5250.0, // Assuming the token has a multiplier of 1.5
              uiAmountString: stringifiedNumber('5250'),
            },
          },
          type: 'account',
        },
        program: TOKEN_2022_PROGRAM_ADDRESS,
        space: 170n,
      },
      executable: false,
      lamports: lamports(2074080n),
      owner: address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      rentEpoch: 18446744073709551615n,
      space: 170n,
    },
    pubkey: address('99h75qo54R7aKr5rVndvxvzFwmLskQtHk9QFU32N6QUf'),
  });

  const createMockTokenMetadata = (): FungibleAssetMetadata => ({
    fungible: true,
    iconUrl: 'http://iconUrl.com',
    units: [],
    name: 'Some Token',
    symbol: 'SYMBOL',
  });

  const createMockProgramNotification = (): ProgramNotification => ({
    jsonrpc: '2.0',
    method: 'programNotification' as const,
    params: {
      subscription: 1,
      result: {
        context: {
          slot: 1,
        },
        value: createMockTokenAccount() as any,
      },
    },
  });

  describe('#createFromTokenAccount', () => {
    it('should create a TokenAsset from a token account', () => {
      const tokenAccount = createMockTokenAccount();

      const tokenAsset = TokenAssetFactory.createFromTokenAccount(
        tokenAccount,
        createMockTokenMetadata(),
        'keyringAccountId',
        Network.Mainnet,
      );

      expect(tokenAsset).toStrictEqual({
        assetType:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:8ACxyJds7t1Tp6Qd8w2iNinVmPKr6oj3MnTqXKeQiNcn',
        keyringAccountId: 'keyringAccountId',
        network: Network.Mainnet,
        mint: '8ACxyJds7t1Tp6Qd8w2iNinVmPKr6oj3MnTqXKeQiNcn',
        pubkey: '99h75qo54R7aKr5rVndvxvzFwmLskQtHk9QFU32N6QUf',
        symbol: 'SYMBOL',
        decimals: 9,
        rawAmount: '3500000000000',
        uiAmount: '5250',
      });
    });
  });

  describe('#createFromProgramNotification', () => {
    it('should create a TokenAsset from a program notification', () => {
      const programNotification = createMockProgramNotification();

      const tokenAsset = TokenAssetFactory.createFromProgramNotification(
        programNotification,
        'keyringAccountId',
        Network.Mainnet,
      );

      expect(tokenAsset).toStrictEqual({
        assetType:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:8ACxyJds7t1Tp6Qd8w2iNinVmPKr6oj3MnTqXKeQiNcn',
        keyringAccountId: 'keyringAccountId',
        network: Network.Mainnet,
        mint: '8ACxyJds7t1Tp6Qd8w2iNinVmPKr6oj3MnTqXKeQiNcn',
        pubkey: '99h75qo54R7aKr5rVndvxvzFwmLskQtHk9QFU32N6QUf',
        symbol: '',
        decimals: 9,
        rawAmount: '3500000000000',
        uiAmount: '5250',
      });
    });
  });
});
