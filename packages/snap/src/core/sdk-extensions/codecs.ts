import type { Infer } from '@metamask/superstruct';
import type {
  CompilableTransactionMessage,
  GetMultipleAccountsApi,
  Rpc,
  Transaction,
  TransactionMessageBytes,
} from '@solana/kit';
import {
  compileTransactionMessage,
  decompileTransactionMessageFetchingLookupTables,
  getBase64Decoder,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getTransactionDecoder,
  getTransactionEncoder,
  pipe,
} from '@solana/kit';

import { PromiseAny } from '../utils/PromiseAny';
import type { Base64Struct } from '../validation/structs';

/**
 * Encodes a compilable transaction message to a base64 string.
 *
 * @param compilableTransactionMessage - The compilable transaction message to convert.
 * @returns The base64 encoded string.
 */
export const fromCompilableTransactionMessageToBase64String = async (
  compilableTransactionMessage: CompilableTransactionMessage,
): Promise<Infer<typeof Base64Struct>> =>
  pipe(
    compilableTransactionMessage,
    // Compile it.
    compileTransactionMessage,
    // Convert the compiled message into a byte array.
    getCompiledTransactionMessageEncoder().encode,
    // Encode that byte array as a base64 string.
    getBase64Decoder().decode,
  );

/**
 * Decodes a base64 encoded string to a compilable transaction message.
 *
 * WARNING: Throws an error if the base64 encoded string is not a valid compilable transaction message.
 *
 * @param base64String - The base64 encoded string to decode.
 * @param rpc - The RPC to use to fetch lookup tables.
 * @returns The decoded compilable transaction message.
 */
export const fromBase64StringToCompilableTransactionMessage = async (
  base64String: Infer<typeof Base64Struct>,
  rpc: Rpc<GetMultipleAccountsApi>,
): Promise<CompilableTransactionMessage> =>
  pipe(
    base64String,
    getBase64Encoder().encode,
    getCompiledTransactionMessageDecoder().decode,
    async (decodedMessageBytes) =>
      decompileTransactionMessageFetchingLookupTables(decodedMessageBytes, rpc),
  );

/**
 * Decodes bytes to a compilable transaction message.
 *
 * WARNING: Throws an error if the bytes are not a valid compilable transaction message.
 *
 * @param messageBytes - The bytes to decode.
 * @param rpc - The RPC to use to fetch lookup tables.
 * @returns The decoded compilable transaction message.
 */
export const fromBytesToCompilableTransactionMessage = async (
  messageBytes: TransactionMessageBytes,
  rpc: Rpc<GetMultipleAccountsApi>,
): Promise<CompilableTransactionMessage> =>
  pipe(
    messageBytes,
    getCompiledTransactionMessageDecoder().decode,
    async (decodedMessageBytes) =>
      decompileTransactionMessageFetchingLookupTables(decodedMessageBytes, rpc),
  );

/**
 * Encodes a transaction to a base64 string.
 *
 * @param transaction - The transaction to encode.
 * @returns The base64 encoded string.
 */
export const fromTransactionToBase64String = async (
  transaction: Transaction,
): Promise<Infer<typeof Base64Struct>> =>
  pipe(transaction, getTransactionEncoder().encode, getBase64Decoder().decode);

/**
 * Decodes a base64 string to a transaction.
 *
 * WARNING: Throws an error if the base64 string is not a valid transaction.
 *
 * INFO: The lifetime constraint is not attached directly to the transaction, but it's
 * present in the transaction message.
 *
 * @param base64String - The base64 string to decode.
 * @returns The decoded transaction.
 */
export const fromBase64StringToTransaction = async (
  base64String: Infer<typeof Base64Struct>,
): Promise<Transaction> =>
  pipe(base64String, getBase64Encoder().encode, getTransactionDecoder().decode);

/**
 * Decodes a base64 string to a transaction or a compilable transaction message.
 *
 * @param base64String - The base64 string to decode.
 * @param rpc - The RPC to use to fetch lookup tables.
 * @returns The decoded transaction or compilable transaction message.
 */
export const fromUnknowBase64StringToTransactionOrTransactionMessage = async (
  base64String: Infer<typeof Base64Struct>,
  rpc: Rpc<GetMultipleAccountsApi>,
): Promise<Transaction | CompilableTransactionMessage> =>
  PromiseAny<Transaction | CompilableTransactionMessage>([
    fromBase64StringToTransaction(base64String),
    fromBase64StringToCompilableTransactionMessage(base64String, rpc),
  ]);
