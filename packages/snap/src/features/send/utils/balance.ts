import { Caip19Id } from '../../../core/constants/solana';
import type { FormFieldError } from '../../../core/types/error';
import type { SendContext } from '../types';
import { SendCurrency } from '../types';

/**
 * Validates if the given value exceeds the balance in the context.
 *
 * @param value - The value to validate.
 * @param context - The context containing balance and currency information.
 * @returns Returns an error if the balance is insufficient, otherwise null.
 */
export function validateBalance(
  value: string,
  context: SendContext,
): FormFieldError | null {
  // FIXME: for now, always use mainnet for prices
  const { price } = context.tokenPrices[Caip19Id.SolMainnet] ?? { price: 0 };

  const amountGreaterThanBalance =
    parseFloat(
      context.currencySymbol === SendCurrency.FIAT
        ? (parseFloat(value) / price).toString()
        : value,
    ) > parseFloat(context.balances[context.fromAccountId]?.amount ?? '0');

  return amountGreaterThanBalance
    ? { message: 'Insufficient balance', value }
    : null;
}
