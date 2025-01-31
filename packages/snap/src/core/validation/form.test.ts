import type { SendContext } from '../../features/send/types';
import { SendCurrencyType } from '../../features/send/types';
import { Caip19Id } from '../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../test/mocks/solana-keyring-accounts';
import type { FieldValidationFunction } from '../types/form';
import { required, sendFieldsAreValid, validateField } from './form';

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

describe('sendFieldsAreValid', () => {
  it('returns true when all fields are valid', () => {
    const context = {
      preferences: {
        locale: 'en',
      },
      tokenCaipId: Caip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '100',
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [Caip19Id.SolTestnet]: {
            amount: '123', // sender has 123 SOL, more than the amount to send
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
    } as unknown as SendContext;

    const result = sendFieldsAreValid(context);
    expect(result).toBe(true);
  });

  it('returns false when any field is invalid', () => {
    const context = {
      preferences: {
        locale: 'en',
      },
      tokenCaipId: Caip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '', // amount is invalid
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [Caip19Id.SolTestnet]: {
            amount: '123',
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
    } as unknown as SendContext;

    const result = sendFieldsAreValid(context);
    expect(result).toBe(false);
  });

  it('returns false when the amount is greater than the balance', () => {
    const contextWithInvalidBalance = {
      preferences: {
        locale: 'en',
      },
      tokenCaipId: Caip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '100',
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [Caip19Id.SolTestnet]: {
            amount: '5', // sender has 5 SOL, but we're trying to send 100
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
    } as unknown as SendContext;

    const result = sendFieldsAreValid(contextWithInvalidBalance);
    expect(result).toBe(false);
  });
});
