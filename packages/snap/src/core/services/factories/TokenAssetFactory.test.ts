import {
  address,
  lamports,
  stringifiedBigInt,
  stringifiedNumber,
  type AccountInfoBase,
  type AccountInfoWithPubkey,
} from '@solana/kit';

import type { TokenAccountInfoWithJsonData } from '../../sdk-extensions/rpc-api';
import { TokenAssetFactory } from './TokenAssetFactory';

describe('TokenAssetFactory', () => {
  const createMockTokenAccount = (): AccountInfoWithPubkey<
    AccountInfoBase & TokenAccountInfoWithJsonData
  > => ({
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
              uiAmount: 5600.0,
              uiAmountString: stringifiedNumber('5600'),
            },
          },
          type: 'account',
        },
        program: address('spl-token-2022'),
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

  const createMockTokenMetadata = () => ({
    symbol: 'symbol',
    decimals: 9,
    multiplier: '1',
  });

  const createMockProgramNotification = () => ({
    jsonrpc: '2.0',
    method: 'programNotification',
    params: {
      result: {
        value: {
          account: {
            data: {
              parsed: {
                info: {
                  extensions: [],
                  isNative: false,
                  mint: 'mint',
                  owner: 'owner',
                  state: 'state',
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmount: 1,
                    uiAmountString: '1',
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  describe('#createFromProgramNotification', () => {
    it('should create a TokenAsset from a program notification', () => {
      const programNotification = createMockProgramNotification();
      const tokenAsset = TokenAssetFactory.createFromProgramNotification(
        programNotification,
        'keyringAccountId',
        'network',
      );
      expect(tokenAsset).toBeDefined();
    });
  });
});
