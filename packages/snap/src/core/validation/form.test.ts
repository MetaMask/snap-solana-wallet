import type { FieldValidationFunction } from '../types/form';
import { validateField, required } from './form';

describe('validateField', () => {
  const validation: Partial<Record<'test', FieldValidationFunction[]>> = {
    test: [required('send.fromRequiredError')],
  };

  it('returns no error for a valid account', () => {
    const result = validateField('test', 'validAccount', validation);
    expect(result).toBeNull();
  });

  it('returns required error for an empty account', () => {
    const result = validateField('test', '', validation);
    expect(result).toStrictEqual({
      message: 'Account is required',
      value: '',
    });
  });

  it('returns null if no validation functions are provided', () => {
    const result = validateField('', '', {});
    expect(result).toBeNull();
  });
});
