import { address as addressValidator } from '@solana/kit';

import type {
  FieldValidationFunction,
  ValidationFunction,
} from '../../../core/types/form';
import { solToLamports } from '../../../core/utils/conversion';
import {
  i18n,
  type Locale,
  type LocalizedMessage,
} from '../../../core/utils/i18n';
import {
  getBalance,
  getIsNativeToken,
  getNativeTokenBalance,
  getTokenAmount,
} from '../selectors';
import type { SendContext } from '../types';
import { SendFormNames } from '../types';
import { isSolanaDomain } from '../utils/isSolanaDomain';
import { validation } from '../views/SendForm/validation';

/**
 * Validates a field value based on the provided validation functions.
 *
 * @param name - The name of the field.
 * @param value - The value of the field.
 * @param _validation - An object containing validation functions for each field.
 * @returns The first validation error found, or null if no errors.
 */
export function validateField<FieldNames extends string | number | symbol>(
  name: FieldNames,
  value: string,
  _validation: Partial<Record<FieldNames, FieldValidationFunction[]>>,
) {
  if (!_validation[name]) {
    return null;
  }

  return (
    _validation[name]
      ?.map((validator) => {
        return validator(value);
      })
      .find((result) => result !== null) ?? null
  );
}

/**
 * Validates if all fields set in the form are valid.
 *
 * @param context - The send context, where values are read from.
 * @returns True if all fields are valid, otherwise false.
 */
export function sendFieldsAreValid(context: SendContext): boolean {
  const allValidators = validation(context);

  const values: Partial<Record<SendFormNames, string | null>> = {
    [SendFormNames.SourceAccountSelector]: context.fromAccountId,
    [SendFormNames.AmountInput]: context.amount,
    [SendFormNames.DestinationAccountInput]: context.toAddress,
  };

  const isAllValidatorsValid = Object.entries(allValidators).every(
    ([field, fieldValidation]) => {
      const value = values[field as SendFormNames];
      if (!value) {
        return false;
      }
      return fieldValidation.every((validator) => validator(value) === null);
    },
  );

  return isAllValidatorsValid;
}

/**
 * Validates that the given value is a string.
 *
 * @param message - The error message to return if validation fails.
 * @param locale - The locale of the message.
 * @returns True if the value is valid, otherwise false.
 */
export const required: ValidationFunction = (
  message: LocalizedMessage,
  locale: Locale,
) => {
  const translate = i18n(locale);

  return (value: string) => {
    const error = value === '' ? { message: translate(message), value } : null;
    return error ? { message: error.message, value } : null;
  };
};

export const addressOrDomain: ValidationFunction = (
  message: LocalizedMessage,
  locale: Locale,
) => {
  const translate = i18n(locale);

  return (value: string) => {
    try {
      if (isSolanaDomain(value)) {
        return null;
      }
      // eslint-disable-next-line no-new
      addressValidator(value);
      return null;
    } catch {
      return { message: translate(message), value };
    }
  };
};

/**
 * Validates that the given value is a valid Solana address.
 *
 * @param message - The error message to return if validation fails.
 * @param locale - The locale of the message.
 * @returns True if the value is valid, otherwise an object with the error message.
 */
export const address: ValidationFunction = (
  message: LocalizedMessage,
  locale: Locale,
) => {
  const translate = i18n(locale);

  return (value: string) => {
    try {
      // eslint-disable-next-line no-new
      addressValidator(value);
      return null;
    } catch {
      return { message: translate(message), value };
    }
  };
};

/**
 * Custom validation logic for the amount input field.
 *
 * It's invalid when:
 * - The value parses to 0.
 * - The user is sending SOL, and the amount is lower than the minimum balance for rent exemption.
 * - The amount + fee is greater than the balance.
 *
 * @param context - The send context, where values are read from.
 * @returns True if the value is valid, otherwise an object with the error message.
 */
export const amountInput = (context: SendContext) => {
  const {
    minimumBalanceForRentExemptionSol,
    preferences: { locale },
    feeEstimatedInSol,
    selectedTokenMetadata,
  } = context;
  const translate = i18n(locale);

  return (value: string) => {
    // If the value is empty string, it's invalid but we don't want to show an error
    if (value === '') {
      return { message: '', value };
    }

    const tokenAmount = getTokenAmount({ ...context, amount: value });
    const tokenAmountLamports = solToLamports(tokenAmount ?? '0');

    const balance = getBalance(context);
    const balanceLamports = solToLamports(balance);

    const feeEstimatedInLamports = solToLamports(feeEstimatedInSol ?? '0');

    const minimumBalanceForRentExemptionLamports = solToLamports(
      minimumBalanceForRentExemptionSol ?? '0',
    );
    const solBalance = getNativeTokenBalance(context);
    const solBalanceLamports = solToLamports(solBalance);
    const isNativeToken = getIsNativeToken(context);

    // If you try to send more than your balance, it's invalid
    const isAmountGreaterThanBalance = tokenAmountLamports.gt(balanceLamports);
    if (isAmountGreaterThanBalance) {
      return {
        message: `${translate('send.insufficientBalance')}: ${balance} ${selectedTokenMetadata?.symbol ?? ''}`,
        value,
      };
    }

    if (isNativeToken) {
      // If the value is lower than the minimum balance for rent exemption, it's invalid
      const valueLowerThanMinimum = tokenAmountLamports.lt(
        minimumBalanceForRentExemptionLamports,
      );

      if (valueLowerThanMinimum) {
        return {
          message: translate(
            'send.amountGreatherThanMinimumBalanceForRentExemptionError',
            {
              minimumValue: minimumBalanceForRentExemptionSol,
            },
          ),
          value,
        };
      }

      // If the (amount + fee + minimum balance for rent exemption) is greater than the balance, it's invalid
      const isAmountPlusFeePlusRentExemptionGreaterThanBalance =
        tokenAmountLamports
          .plus(feeEstimatedInLamports)
          .plus(minimumBalanceForRentExemptionLamports)
          .gt(balanceLamports);

      if (isAmountPlusFeePlusRentExemptionGreaterThanBalance) {
        return {
          message: translate('send.insuffientSolToCoverFee'),
          value,
        };
      }
    } else {
      // If user has less SOL than the fee + rent, it's invalid. Even if the user has enough SOL to pay for the fee, the balance after tx cannot drop below the rent.
      const isSolBalanceLowerThanFeePlusRent = feeEstimatedInLamports
        .plus(minimumBalanceForRentExemptionLamports)
        .gt(solBalanceLamports);

      if (isSolBalanceLowerThanFeePlusRent) {
        return {
          message: translate('send.insuffientSolToCoverFee'),
          value,
        };
      }
    }

    // If the value parses to 0, it's invalid but we don't want to show an error
    if (tokenAmountLamports.isZero()) {
      return { message: '', value };
    }

    // If you have 0 SOL, you can't pay for the fee, it's invalid
    if (solBalanceLamports.isZero()) {
      return {
        message: translate('send.insuffientSolToCoverFee'),
        value,
      };
    }

    return null;
  };
};
