import type {
  Balance,
  KeyringAccount,
  Transaction,
} from '@metamask/keyring-api';
import BigNumber from 'bignumber.js';

/**
 *
 * @param options0
 * @param options0.currentAccounts
 * @param options0.currentBalances
 * @param options0.transactions
 */
export function updateBalancesPostTransactions({
  currentAccounts,
  currentBalances,
  transactions,
}: {
  currentAccounts: KeyringAccount[];
  currentBalances: Record<string, Record<CAIP, Balance>>;
  transactions: Transaction[];
}): Record<string, Record<string, Balance>> {
  const updatedAccountBalances: Record<string, Record<string, Balance>> = {};

  const sourceTransactions = transactions?.from ?? [];
  const destinationTransactions = transactions?.to ?? [];

  /**
   * For each source transaction:
   * 1. Get the asset and source address
   * 2. Using the address, get the keyring account
   * 3. Update the balance of the asset by removing the amount from the source address
   */
  for (const sourceTransaction of sourceTransactions) {
    const { asset, address } = sourceTransaction;

    const keyringAccount = currentAccounts.find(
      (currentAccount) => currentAccount.address === address,
    );

    if (!keyringAccount) {
      continue;
    }

    if (!asset?.fungible) {
      continue;
    }

    const assetId = asset.type;
    const currentBalance =
      currentBalances[keyringAccount.id]?.[assetId]?.amount;

    if (!currentBalance) {
      continue;
    }

    const fee = transactions?.fees.map((fee) => {
      if (fee.asset.type === assetId) {
        return fee.amount;
      }

      return 0;
    });
    const sentAmount = asset.amount - fee;
    const newBalance = BigNumber(currentBalance)
      .minus(sentAmount)
      .minus(fee)
      .toString();

    updatedAccountBalances[keyringAccount.id] = {
      ...updatedAccountBalances[keyringAccount.id],
      [assetId]: {
        amount: newBalance,
        unit: asset.unit,
      },
    };
  }

  for (const destinationTransaction of destinationTransactions) {
    const { asset, address } = destinationTransaction;

    const keyringAccount = currentAccounts.find(
      (currentAccount) => currentAccount.address === address,
    );

    if (!keyringAccount) {
      continue;
    }

    if (!asset?.fungible) {
      continue;
    }

    const assetId = asset.type;
    const currentBalance =
      currentBalances[keyringAccount.id]?.[assetId]?.amount;

    if (!currentBalance) {
      continue;
    }

    const receivedAmount = asset.amount;
    const newBalance = BigNumber(currentBalance)
      .plus(receivedAmount)
      .toString();

    updatedAccountBalances[keyringAccount.id] = {
      ...updatedAccountBalances[keyringAccount.id],
      [assetId]: {
        amount: newBalance,
        unit: asset.unit,
      },
    };
  }

  return updatedAccountBalances;
}
