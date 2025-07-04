import type { LocalizedMessage } from '../utils/i18n';
import type { FormFieldError } from './error';

export type FormState<FormNames extends string | number | symbol> = Record<
  FormNames,
  string | number | boolean | null
>;

export type FieldValidationFunction = (value: string) => FormFieldError;
export type ValidationFunction = (
  message: LocalizedMessage,
  value?: any,
) => FieldValidationFunction;
