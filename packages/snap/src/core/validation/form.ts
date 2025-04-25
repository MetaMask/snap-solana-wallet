import { address as addressValidator } from '@solana/kit';

import {
  getBalance,
  getIsNativeToken,
  getNativeTokenBalance,
  getTokenAmount,
} from '../../features/send/selectors';
import type { SendContext } from '../../features/send/types';
import { SendFormNames } from '../../features/send/types';
import { validation } from '../../features/send/views/SendForm/validation';
import type {
  FieldValidationFunction,
  ValidationFunction,
} from '../types/form';
import { solToLamports } from '../utils/conversion';
import { i18n, type Locale, type LocalizedMessage } from '../utils/i18n';

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

    // If the value parses to 0, it's invalid but we don't want to show an error
    if (tokenAmountLamports.isZero()) {
      return { message: '', value };
    }

    // If you try to send more than your balance, it's invalid
    const isAmountGreaterThanBalance = tokenAmountLamports.gt(balanceLamports);
    if (isAmountGreaterThanBalance) {
      return {
        message: translate('send.insufficientBalance'),
        value,
      };
    }

    // If you have 0 SOL, you can't pay for the fee, it's invalid
    const solBalance = getNativeTokenBalance(context);
    const solBalanceLamports = solToLamports(solBalance);
    if (solBalanceLamports.isZero()) {
      return {
        message: translate('send.insuffientSolToCoverFee'),
        value,
      };
    }

    const isNativeToken = getIsNativeToken(context);

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
      // If the SOL balance is lower than the fee, it's invalid
      const isFeeGreaterThanSolBalance =
        feeEstimatedInLamports.gt(solBalanceLamports);

      if (isFeeGreaterThanSolBalance) {
        return {
          message: translate('send.insuffientSolToCoverFee'),
          value,
        };
      }
    }

    return null;
  };
};
