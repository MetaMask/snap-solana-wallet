import { array, bigint, boolean, number, string, type } from 'superstruct';

export const GetBalanceResponseStruct = type({
  context: type({
    slot: bigint(),
  }),
  value: bigint(),
});

const TokenAmountStruct = type({
  amount: string(),
  decimals: number(),
});

const TokenAccountInfoStruct = type({
  mint: string(),
  owner: string(),
  isNative: boolean(),
  tokenAmount: TokenAmountStruct,
});

const TokenAccountDataStruct = type({
  parsed: type({
    info: TokenAccountInfoStruct,
  }),
});

const TokenAccountStruct = type({
  account: type({
    data: TokenAccountDataStruct,
  }),
});

export const GetTokenAccountsByOwnerResponseStruct = type({
  context: type({
    slot: bigint(),
  }),
  value: array(TokenAccountStruct),
});
