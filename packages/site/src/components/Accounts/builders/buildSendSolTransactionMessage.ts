import { getTransferSolInstruction } from '@solana-program/system';
import type { Address } from '@solana/kit';
import {
  appendTransactionMessageInstruction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { Network } from '../../../../../snap/src/core/constants/solana';
import { base64EncodeTransaction } from '../base64EncodeTransaction';
import { networkToUrl } from '../networkToUrl';

export const buildSendSolTransactionMessage = async (
  from: Address,
  to: Address,
  amountInLamports: number | bigint,
  network: Network,
): Promise<string> => {
  const url = networkToUrl(network);
  const rpc = createSolanaRpc(url);

  const latestBlockhash = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    // Every transaction must state from which account the transaction fee should be debited from,
    // and that account must sign the transaction. Here, we'll make the source account pay the fee.
    (tx) => setTransactionMessageFeePayer(from, tx),
    // A transaction is valid for execution as long as it includes a valid lifetime constraint. Here
    // we supply the hash of a recent block. The network will accept this transaction until it
    // considers that hash to be 'expired' for the purpose of transaction execution.
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash.value, tx),
    // Every transaction needs at least one instruction. This instruction describes the transfer.
    (tx) =>
      appendTransactionMessageInstruction(
        /**
         * The system program has the exclusive right to transfer Lamports from one account to
         * another. Here we use an instruction creator from the `@solana-program/system` package
         * to create a transfer instruction for the system program.
         */
        getTransferSolInstruction({
          amount: amountInLamports,
          destination: to,
          source: createNoopSigner(from),
        }),
        tx,
      ),
  );

  const transactionMessageBase64 =
    await base64EncodeTransaction(transactionMessage);

  return transactionMessageBase64;
};
