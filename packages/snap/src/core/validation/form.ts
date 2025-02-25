import { address as addressValidator } from '@solana/web3.js';

import type { SendContext } from '../../features/send/types';
import { SendFormNames } from '../../features/send/types';
import { validateBalance } from '../../features/send/utils/validateBalance';
import { validation } from '../../features/send/views/SendForm/validation';
import { KnownCaip19Id } from '../constants/solana';
import type {
  FieldValidationFunction,
  ValidationFunction,
} from '../types/form';
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

  const values: Partial<Record<SendFormNames, string>> = {
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

  // validateBalance is defined separately from the other validators
  const amount = values[SendFormNames.AmountInput];
  if (!amount) {
    return false;
  }
  const isValidateBalanceValid = validateBalance(amount, context) === null;

  return isAllValidatorsValid && isValidateBalanceValid;
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
 *
 * @param context - The send context, where values are read from.
 * @returns True if the value is valid, otherwise an object with the error message.
 */
export const amountInput = (context: SendContext) => {
  const {
    minimumBalanceForRentExemptionSol,
    preferences: { locale },
    tokenCaipId,
  } = context;
  const translate = i18n(locale);

  return (value: string) => {
    // If the value parses to 0, it's invalid but we don't want to show an error
    if (parseFloat(value) === 0) {
      return { message: '', value };
    }

    const valueLowerThanMinimum =
      parseFloat(value) < parseFloat(minimumBalanceForRentExemptionSol);

    if (valueLowerThanMinimum && tokenCaipId === KnownCaip19Id.SolMainnet) {
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

    return null;
  };
};
