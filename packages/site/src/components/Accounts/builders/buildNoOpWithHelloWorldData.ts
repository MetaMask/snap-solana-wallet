import type { Address } from '@solana/kit';
import { getUtf8Codec } from '@solana/kit';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import type { Network } from '../../../../../snap/src/core/constants/solana';
import { networkToUrl } from '../networkToUrl';

export const buildNoOpWithHelloWorldData = async (
  feePayerAddress: Address,
  network: Network,
) => {
  const url = networkToUrl(network);
  const connection = new Connection(url);

  const feePayer = new PublicKey(feePayerAddress);

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer,
    recentBlockhash: blockhash.blockhash,
  }).add(
    new TransactionInstruction({
      data: getUtf8Codec().encode('Hello, world!') as any,
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    }),
  );

  const serializedTransactionMessage = transaction.serializeMessage();

  const transactionMessageBase64 =
    serializedTransactionMessage.toString('base64');

  return transactionMessageBase64;
};
