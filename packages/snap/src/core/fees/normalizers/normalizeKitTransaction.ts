import {
  getCompiledTransactionMessageDecoder,
  type Transaction as KitTransaction,
} from '@solana/kit';

import type { NormalizedInput } from './Normalizer';

export const normalizeKitTransaction = (
  input: KitTransaction,
): NormalizedInput => {
  const transactionMessage = getCompiledTransactionMessageDecoder().decode(
    input.messageBytes,
  );

  return {
    ed25519Signatures: Object.values(input.signatures).filter(
      (signature) => signature !== null,
    ),
    instructions: transactionMessage.instructions.map((item) => ({
      accounts: [], // We don't need them
      data: item.data ?? new Uint8Array(),
      programAddress:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transactionMessage.staticAccounts[item.programAddressIndex]!,
    })),
  };
};
