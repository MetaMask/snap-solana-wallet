import type { Transaction } from '@metamask/keyring-api';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';

import { type Network, type SolanaTransaction } from '../../../domain';
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

  /**
   * And now we check if there are any native transfers to the same address.
   */
  const nativeTransfersToSelf = parseTransactionSplTransfersToSelf({
    scope,
    transactionData,
  });

  if (nativeTransfersToSelf.from.length > 0) {
    from.push(...nativeTransfersToSelf.from);
  }

  if (nativeTransfersToSelf.to.length > 0) {
    to.push(...nativeTransfersToSelf.to);
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

  const tokenProgramAccountIndex =
    transactionData.transaction.message.accountKeys.findIndex(
      (account) => account === TOKEN_PROGRAM_ADDRESS,
    );

  /**
   * If there are no Token Program instructions, then we have no native transfers.
   */
  if (tokenProgramAccountIndex === -1) {
    return {
      from,
      to,
    };
  }

  instructions.forEach((instruction) => {
    const { accounts, data, programIdIndex } = instruction;

    if (programIdIndex !== tokenProgramAccountIndex) {
      return;
    }

    /**
     * If we are here, we have a Token Program instruction.
     * It can be a Transfer or a TransferChecked.
     * We need to check the data to see which one it is.
     */
    let fromAccountIndex: number | undefined;
    let toAccountIndex: number | undefined;

    if (accounts.length === 5) {
      /**
       * TransferChecked instruction.
       * Accounts: [source, mint, destination, authority, signers]
       */
      fromAccountIndex = accounts[0];
      toAccountIndex = accounts[2];
    } else if (accounts.length === 3) {
      /**
       * Transfer instruction.
       * Accounts: [source, destination, authority]
       */
      fromAccountIndex = accounts[0];
      toAccountIndex = accounts[1];
    }

    if (
      fromAccountIndex === undefined ||
      toAccountIndex === undefined ||
      fromAccountIndex !== toAccountIndex
    ) {
      return;
    }

    const fromTokenAccountAddress =
      transactionData.transaction.message.accountKeys[fromAccountIndex];
    const toTokenAccountAddress =
      transactionData.transaction.message.accountKeys[toAccountIndex];

    if (
      !fromTokenAccountAddress ||
      !toTokenAccountAddress ||
      fromTokenAccountAddress !== toTokenAccountAddress
    ) {
      return;
    }

    const amount = decodeSplTransferAmount(bs58.decode(data));

    /**
     * Using the account index, we can go to the `preTokenBalances` and get the `mint` address as well as the `owner` address.
     */
    const mint = transactionData.meta?.preTokenBalances?.find(
      (b) => b.accountIndex === fromAccountIndex,
    )?.mint;
    const owner = transactionData.meta?.preTokenBalances?.find(
      (b) => b.accountIndex === fromAccountIndex,
    )?.owner;

    if (!mint || !owner) {
      return;
    }

    const caip19Id = tokenAddressToCaip19(scope, mint);

    from.push({
      address: owner,
      asset: {
        amount: amount.toString(),
        fungible: true,
        type: caip19Id,
        unit: '',
      },
    });

    to.push({
      address: owner,
      asset: {
        amount: amount.toString(),
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
 * Decodes the amount from the instruction data.
 * @param data - The instruction data.
 * @returns The amount.
 */
export function decodeSplTransferAmount(data: Uint8Array): BigNumber {
  /**
   * Native Solana transfers have a fixed length of 12 bytes.
   * 1 byte - Opcode
   * 8 bytes - Transfer amount unsigned int 64
   */
  let raw = BigInt(0);

  for (let i = 1; i < 9; i++) {
    // eslint-disable-next-line no-bitwise
    raw |= BigInt(data[i] ?? 0) << BigInt(8 * (i - 1));
  }

  return BigNumber(raw.toString()).dividedBy(1e6);
}
