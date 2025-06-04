import type {
  AccountInfoBase,
  AccountInfoWithPubkey,
  Address,
  JsonParsedTokenAccount,
} from '@solana/kit';

/**
 * Re-create this type that is not exported from @solana/kit
 */
export type TokenAccountInfoWithJsonData = Readonly<{
  data: Readonly<{
    parsed: {
      info: JsonParsedTokenAccount;
      type: 'account';
    };
    /** Name of the program that owns this account. */
    program: Address;
    space: bigint;
  }>;
}>;

/**
 * Re-create this type that is not exported from @solana/kit
 */
export type GetTokenAccountsByOwnerResponse<TToken> =
  readonly AccountInfoWithPubkey<AccountInfoBase & TToken>[];
