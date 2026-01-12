import type { Address } from '@solana/kit';
import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createSolanaRpc,
  createTransactionMessage,
  getUtf8Encoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { Network } from '../../../../../snap/src/core/constants/solana';
import { networkToUrl } from '../networkToUrl';

const MEMO_PROGRAM_ADDRESS = address(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export const buildNoOpWithHelloWorldData = async (
  feePayerAddress: Address,
  network: Network,
) => {
  const url = networkToUrl(network);
  const rpc = createSolanaRpc(url);

  const latestBlockhash = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 'legacy' }),
    (tx) => setTransactionMessageFeePayer(feePayerAddress, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash.value, tx),
    (tx) =>
      appendTransactionMessageInstruction(
        {
          data: getUtf8Encoder().encode('Hello, world!'),
          programAddress: MEMO_PROGRAM_ADDRESS,
        },
        tx,
      ),
  );

  const compiledTransaction = compileTransaction(transactionMessage);
  // eslint-disable-next-line no-restricted-globals
  const transactionMessageBase64 = Buffer.from(
    compiledTransaction.messageBytes,
  ).toString('base64');

  return transactionMessageBase64;
};
