import type { Transaction } from '@metamask/keyring-api';
import type { IInstruction } from '@solana/kit';
import { address as asAddress, getBase58Codec } from '@solana/kit';
import BigNumber from 'bignumber.js';
import { get } from 'lodash';

import type {
  InstructionParseResult,
  InstructionParseSuccess,
} from '../../../../entities';
import { parseInstruction } from '../../../../entities';
import { type Network } from '../../../constants/solana';
import type {
  SolanaInstruction,
  SolanaTransaction,
} from '../../../types/solana';
import { tokenAddressToCaip19 } from '../../../utils/tokenAddressToCaip19';

/**
 * Parses SPL token transfers from a transaction data object.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing token balance changes.
 * @returns Transaction transfer details.
 */
export function parseTransactionSplTransfers({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): {
  from: Transaction['from'];
  to: Transaction['to'];
} {
  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  const preBalances = new Map(
    transactionData.meta?.preTokenBalances?.map((balance) => [
      balance.accountIndex,
      new BigNumber(balance.uiTokenAmount.amount),
    ]) ?? [],
  );

  const postBalances = new Map(
    transactionData.meta?.postTokenBalances?.map((balance) => [
      balance.accountIndex,
      new BigNumber(balance.uiTokenAmount.amount),
    ]) ?? [],
  );

  // Track all accounts that had token balance changes
  const allAccountIndexes = new Set([
    ...(transactionData.meta?.preTokenBalances?.map((b) => b.accountIndex) ??
      []),
    ...(transactionData.meta?.postTokenBalances?.map((b) => b.accountIndex) ??
      []),
  ]);

  for (const accountIndex of allAccountIndexes) {
    const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
    const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);
    const balanceDiff = postBalance.minus(preBalance);

    if (balanceDiff.isZero()) {
      continue;
    }

    const tokenDetails =
      transactionData.meta?.preTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      ) ??
      transactionData.meta?.postTokenBalances?.find(
        (b) => b.accountIndex === accountIndex,
      );

    if (!tokenDetails) {
      continue;
    }

    const {
      mint,
      uiTokenAmount: { decimals },
      owner,
    } = tokenDetails;

    const caip19Id = tokenAddressToCaip19(scope, mint);

    if (!owner) {
      continue;
    }

    const amount = balanceDiff
      .absoluteValue()
      .dividedBy(new BigNumber(10).pow(decimals))
      .toString();

    if (balanceDiff.isNegative()) {
      from.push({
        address: owner,
        asset: {
          fungible: true,
          type: caip19Id,
          unit: '', // This will get overwritten by the token metadata when we fetch it
          amount,
        },
      });
    }

    if (balanceDiff.isPositive()) {
      to.push({
        address: owner,
        asset: {
          fungible: true,
          type: caip19Id,
          unit: '', // This will get overwritten by the token metadata when we fetch it
          amount,
        },
      });
    }
  }

  // And now we check if there are any transfers to the same address.
  const transfersToSelf = parseTransactionSplTransfersToSelf({
    scope,
    transactionData,
  });

  if (transfersToSelf.from.length > 0) {
    from.push(...transfersToSelf.from);
  }

  if (transfersToSelf.to.length > 0) {
    to.push(...transfersToSelf.to);
  }

  return { from, to };
}

/**
 * Parses SPL token transfers where the sender and receiver are the same address.
 * @param options0 - The options object.
 * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
 * @param options0.transactionData - The raw transaction data containing token balance changes.
 * @returns Transaction transfer details.
 */
export function parseTransactionSplTransfersToSelf({
  scope,
  transactionData,
}: {
  scope: Network;
  transactionData: SolanaTransaction;
}): { from: Transaction['from']; to: Transaction['to'] } {
  const { instructions } = transactionData.transaction.message;

  const from: Transaction['from'] = [];
  const to: Transaction['to'] = [];

  // Converts a SolanaInstruction to an IInstruction that we can parse with `parseInstruction`
  const toIInstruction = (item: SolanaInstruction): IInstruction => {
    // Build the accounts array
    const accounts = item.accounts.map((accountIndex) => {
      const account =
        transactionData.transaction.message.accountKeys[accountIndex];
      if (!account) {
        throw new Error('Account not found');
      }
      return {
        address: account,
        role: 0,
      };
    });

    const programAddress =
      transactionData.transaction.message.accountKeys[item.programIdIndex];
    if (!programAddress) {
      throw new Error('Program address not found');
    }

    // Build the IInstruction object
    const iInstruction = {
      accounts,
      data: getBase58Codec().encode(item.data),
      programAddress,
    } as unknown as IInstruction;

    return iInstruction;
  };

  // Convert and parse all instructions
  const parsedInstructions = instructions
    .map(toIInstruction)
    .map(parseInstruction);

  // Only keep instructions that are self transfers
  const selfTransferInstructions = parsedInstructions.filter(
    isInstructionSelfTransfer,
  );

  // For each self transfer, populate the `from` and `to` arrays
  selfTransferInstructions.forEach((instruction) => {
    const authority = get(instruction, 'parsed.accounts.authority.address');
    const source = get(instruction, 'parsed.accounts.source.address');

    if (!authority || !source) {
      return;
    }

    // Reverse lookup the account index of the source address
    const sourceAccountIndex =
      transactionData.transaction.message.accountKeys.indexOf(
        asAddress(source),
      );

    // Grab the `mint` and `decimals` from preTokenBalances
    const { mint, uiTokenAmount: { decimals } = {} } =
      transactionData.meta?.preTokenBalances?.find(
        (b) => b.accountIndex === sourceAccountIndex,
      ) ?? {};

    if (!mint || !decimals) {
      return;
    }

    // Compute the amount of the transfer
    const rawAmount = instruction.parsed?.data.amount;
    const amount = BigNumber(rawAmount)
      .dividedBy(new BigNumber(10).pow(decimals))
      .toString();

    // Convert the mint address to a CAIP-19 ID
    const caip19Id = tokenAddressToCaip19(scope, mint);

    from.push({
      address: authority,
      asset: {
        amount,
        fungible: true,
        type: caip19Id,
        unit: '',
      },
    });

    to.push({
      address: authority,
      asset: {
        amount,
        fungible: true,
        type: caip19Id,
        unit: '',
      },
    });
  });

  return {
    from,
    to,
  };
}

/**
 * Checks if an instruction is a self transfer.
 * @param instruction - The instruction to check.
 * @returns True if the instruction is a self transfer, false otherwise.
 */
function isInstructionSelfTransfer(
  instruction: InstructionParseResult,
): instruction is InstructionParseSuccess {
  if (
    instruction.type !== 'Transfer' &&
    instruction.type !== 'TransferChecked'
  ) {
    return false;
  }

  if (!instruction.parsed) {
    return false;
  }

  const { source, destination, authority } = instruction.parsed.accounts ?? {};

  if (!source || !destination || !authority) {
    return false;
  }

  return source.address === destination.address;
}
