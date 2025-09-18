import type { CompiledTransactionMessage } from '@solana/kit';

import type { NormalizedInput } from './types';

export const normalizeCompiledTransactionMessage = (
  compiledTransactionMessage: CompiledTransactionMessage,
): NormalizedInput => ({
  ed25519Signatures: ['signature'], // The compiled transaction message doesn't have ed25519 signatures yet. Best guess is that there will be exactly one, so we fake it.
  instructions: compiledTransactionMessage.instructions.map((item) => ({
    accounts: [], // We don't need them
    data: item.data ?? new Uint8Array(),
    programAddress:
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      compiledTransactionMessage.staticAccounts[item.programAddressIndex]!,
  })),
});
