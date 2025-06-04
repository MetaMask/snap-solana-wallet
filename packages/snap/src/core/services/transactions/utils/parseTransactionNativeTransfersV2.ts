import type { Transaction } from '@metamask/keyring-api';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';

import {
  LAMPORTS_PER_SOL,
  Networks,
  type Network,
} from '../../../constants/solana';
import type { SolanaTransaction } from '../../../domain';
import { parseTransactionFees } from './parseTransactionFees';

/**
 * Parses native SOL token transfers from a transaction using its instructions.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing balance changes.
 * @returns Transaction details.
 */
export function parseTransactionNativeTransfersV2({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): {
  fees: Transaction['fees'];
  from: Transaction['from'];
  to: Transaction['to'];
} {
  const fees = parseTransactionFees({
    scope,
    transactionData,
  });

  const allAccountAddresses = [
    ...transactionData.transaction.message.accountKeys,
    ...(transactionData.meta?.loadedAddresses?.writable ?? []),
    ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
  ];

  const fromMovements: Transaction['from'] = [];
  const toMovements: Transaction['to'] = [];

  /**
   * For V2 let's go through the instructions and see if there are any native transfers.
   */
  const { instructions } = transactionData.transaction.message;

  instructions.forEach((instruction) => {
    const { accounts, data, programIdIndex } = instruction;

    const programAddress = allAccountAddresses[programIdIndex];

    if (programAddress !== SYSTEM_PROGRAM_ADDRESS) {
      return;
    }

    const [fromAccountIndex, toAccountIndex] = accounts;

    if (fromAccountIndex === undefined || toAccountIndex === undefined) {
      return;
    }

    const fromAddress = allAccountAddresses[fromAccountIndex];
    const toAddress = allAccountAddresses[toAccountIndex];

    if (!fromAddress || !toAddress) {
      return;
    }

    const decodedData = bs58.decode(data);
    const opcode = decodeOpcode(decodedData);

    if (opcode !== 2) {
      /**
       * Not a Transfer instruction
       */
      return;
    }

    const amount = decodeNativeTransferAmount(decodedData);

    fromMovements.push({
      address: fromAddress,
      asset: {
        amount: amount.toString(),
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
      },
    });

    toMovements.push({
      address: toAddress,
      asset: {
        amount: amount.toString(),
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
      },
    });
  });

  /**
   * Now we want to merge transfers to the same address of the same asset (type).
   */
  const from = aggregateSameAssetMovements(fromMovements);
  const to = aggregateSameAssetMovements(toMovements);

  return {
    fees,
    from,
    to,
  };
}

/**
 * Aggregates movements with the same asset type for the same address.
 *
 * So two movements like this:
 * ```
 * [{
 *   address: '0x1',
 *   asset: {
 *     amount: '50',
 *     fungible: true,
 *     type: 'solana:1',
 *     unit: 'SOL',
 *   },
 * }, {
 *   address: '0x1',
 *   asset: {
 *     amount: '150',
 *     fungible: true,
 *     type: 'solana:1',
 *     unit: 'SOL',
 *   },
 * }]
 * ```
 *
 * will become
 *
 * ```
 * [{
 *   address: '0x1',
 *   asset: {
 *     amount: '200',
 *     fungible: true,
 *     type: 'solana:1',
 *     unit: 'SOL',
 *   },
 * }]
 * ```
 * @param movements - The movements to aggregate.
 * @returns The aggregated movements.
 */
export function aggregateSameAssetMovements(
  movements: Transaction['from'] | Transaction['to'],
) {
  return movements.reduce<Transaction['from'] | Transaction['to']>(
    (acc, movement) => {
      // Find existing movement with same asset type
      const existingMovement = acc.find((item) => {
        // Make sure both assets are fungible and have the same type
        return (
          item?.asset?.fungible === true &&
          movement.asset?.fungible === true &&
          item.asset.type === movement.asset.type &&
          item.address === movement.address
        );
      });

      if (
        existingMovement &&
        existingMovement.asset?.fungible === true &&
        movement.asset?.fungible === true
      ) {
        // Convert string amount to BigNumber, add values, then convert back to string
        const existingAmount = new BigNumber(existingMovement.asset.amount);
        const newAmount = existingAmount.plus(movement.asset.amount);
        existingMovement.asset.amount = newAmount.toString();
      } else {
        acc.push(movement);
      }

      return acc;
    },
    [],
  );
}

/**
 * Decodes the amount from the instruction data.
 * @param data - The instruction data.
 * @returns The amount.
 */
export function decodeOpcode(data: Uint8Array) {
  /**
   * Opcode is the first 4 bytes of the instruction data.
   */
  let raw = BigInt(0);
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[i] ?? 0) << BigInt(8 * i);
  }

  return Number(raw);
}

/**
 * Decodes the amount from the instruction data.
 * @param data - The instruction data.
 * @returns The amount.
 */
export function decodeNativeTransferAmount(data: Uint8Array): BigNumber {
  /**
   * Native Solana transfers have a fixed length of 12 bytes.
   * 4 bytes - Instruction index
   * 8 bytes - Transfer amount unsigned int 64
   */
  let raw = BigInt(0);
  for (let i = 4; i < 12; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[i] ?? 0) << BigInt(8 * (i - 4));
  }

  return BigNumber(raw.toString()).dividedBy(LAMPORTS_PER_SOL);
}
