import type { Transaction } from '@metamask/keyring-api';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';

import {
  LAMPORTS_PER_SOL,
  Networks,
  type Network,
} from '../../../constants/solana';
import type { SolanaTransaction } from '../../../types/solana';
import { lamportsToSol } from '../../../utils/conversion';
import { parseTransactionFees } from './parseTransactionFees';

/**
 * Parses native SOL token transfers from a transaction.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing balance changes.
 * @returns Transaction details.
 */
export function parseTransactionNativeTransfers({
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

  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  const preBalances = new Map(
    transactionData.meta?.preBalances?.map((balance, index) => [
      index,
      new BigNumber(balance.toString()),
    ]) ?? [],
  );

  const postBalances = new Map(
    transactionData.meta?.postBalances?.map((balance, index) => [
      index,
      new BigNumber(balance.toString()),
    ]) ?? [],
  );

  /**
   * The indexes of accounts can be higher than account keys. Don't forget `loadedAddresses`!
   * https://solana.stackexchange.com/questions/11981/the-account-index-does-not-exist-in-accountkeys
   */
  const allAccountAddresses = [
    ...transactionData.transaction.message.accountKeys,
    ...(transactionData.meta?.loadedAddresses?.writable ?? []),
    ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
  ];

  /**
   * Track all accounts that had SOL balance changes
   */
  const allAccountIndexes = new Set([
    ...Array.from(preBalances.keys()),
    ...Array.from(postBalances.keys()),
  ]);

  for (const accountIndex of allAccountIndexes) {
    const address = allAccountAddresses[accountIndex]?.toString();

    if (!address) {
      continue;
    }

    const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
    const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);

    // Account 0 is the fee payer
    const paidFeesSol =
      accountIndex === 0
        ? lamportsToSol(transactionData.meta?.fee ?? 0)
        : new BigNumber(0);

    /**
     * Calculate the delta between the balances and convert from lamports to SOL.
     */
    const balanceDiffSol = preBalance
      .minus(postBalance)
      .dividedBy(new BigNumber(LAMPORTS_PER_SOL))
      .minus(paidFeesSol);

    if (balanceDiffSol.isZero()) {
      continue;
    }

    const amount = balanceDiffSol.absoluteValue().toString();

    /**
     * If the pre-balance is greater than the post-balance, it means that the account
     * has lost SOL, so it's a sender.
     */
    if (preBalance.isGreaterThan(postBalance)) {
      from.push({
        address,
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount,
        },
      });
    }

    /**
     * If the pre-balance is less than the post-balance, it means that the account
     * has gained SOL, so it's a receiver.
     */
    if (preBalance.isLessThan(postBalance)) {
      to.push({
        address,
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount,
        },
      });
    }
  }

  /**
   * And now we check if there are any native transfers to the same address.
   */
  const nativeTransfersToSelf = parseTransactionNativeTransfersToSelf({
    scope,
    transactionData,
  });

  if (nativeTransfersToSelf.from.length > 0) {
    from.push(...nativeTransfersToSelf.from);
  }

  if (nativeTransfersToSelf.to.length > 0) {
    to.push(...nativeTransfersToSelf.to);
  }

  return { fees, from, to };
}

/**
 * There are some transactions that are sent from the same address to itself.
 * When this happens, the function above will not find any differences in the balances
 * and we will not be able to detect the transfer.
 *
 * This function is used to parse those transactions.
 *
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing token balance changes.
 * @returns Transaction transfer details.
 */
export function parseTransactionNativeTransfersToSelf({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): {
  from: Transaction['from'];
  to: Transaction['to'];
} {
  const { instructions } = transactionData.transaction.message;

  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  const systemProgramAccountIndex =
    transactionData.transaction.message.accountKeys.findIndex(
      (account) => account === SYSTEM_PROGRAM_ADDRESS,
    );

  /**
   * If there are no System Program instructions, then we have no native transfers.
   */
  if (systemProgramAccountIndex === -1) {
    return {
      from,
      to,
    };
  }

  instructions.forEach((instruction) => {
    const { accounts, data, programIdIndex } = instruction;

    if (programIdIndex !== systemProgramAccountIndex) {
      return;
    }

    const [fromAccountIndex, toAccountIndex] = accounts;

    if (
      fromAccountIndex === undefined ||
      toAccountIndex === undefined ||
      fromAccountIndex !== toAccountIndex
    ) {
      return;
    }

    const fromAddress =
      transactionData.transaction.message.accountKeys[fromAccountIndex];
    const toAddress =
      transactionData.transaction.message.accountKeys[toAccountIndex];

    if (!fromAddress || !toAddress || fromAddress !== toAddress) {
      return;
    }

    const amount = decodeNativeTransferAmount(bs58.decode(data));

    from.push({
      address: fromAddress,
      asset: {
        amount: amount.toString(),
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
      },
    });

    to.push({
      address: toAddress,
      asset: {
        amount: amount.toString(),
        fungible: true,
        type: Networks[scope].nativeToken.caip19Id,
        unit: Networks[scope].nativeToken.symbol,
      },
    });
  });

  return {
    from,
    to,
  };
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
