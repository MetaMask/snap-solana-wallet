import { address as addressValidator } from '@solana/web3.js';
import { nonempty, string, validate } from 'superstruct';

import type {
  FieldValidationFunction,
  ValidationFunction,
} from '../types/form';

/**
 * Validates a field value based on the provided validation functions.
 *
 * @param name - The name of the field.
 * @param value - The value of the field.
 * @param validation - An object containing validation functions for each field.
 * @returns The first validation error found, or null if no errors.
 */
export function validateField<FieldNames extends string | number | symbol>(
  name: FieldNames,
  value: string,
  validation: Partial<Record<FieldNames, FieldValidationFunction[]>>,
) {
  if (!validation[name]) {
    return null;
  }

  return (
    validation[name]
      ?.map((validator) => {
        return validator(value);
      })
      .find((result) => result !== null) ?? null
  );
}

/**
 * Validates that the given value is a string.
 *
 * @param message - The error message to return if validation fails.
 * @returns True if the value is valid, otherwise false.
 */
export const required: ValidationFunction = (message: string) => {
  return (value: string) => {
    const [error] = validate(value, nonempty(string()), { message });
    return error ? { message: error.message, value } : null;
  };
};

/**
 * Validates that the given value is a valid Solana address.
 *
 * @param message - The error message to return if validation fails.
 * @returns True if the value is valid, otherwise an object with the error message.
 */
export const address: ValidationFunction = (message: string) => {
  return (value: string) => {
    try {
      // eslint-disable-next-line no-new
      addressValidator(value);
      return null;
    } catch {
      return { message, value };
    }
  };
};
