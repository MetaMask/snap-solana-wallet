import type { SendContext } from '../../features/send/types';
import { SendCurrencyType } from '../../features/send/types';
import { KnownCaip19Id } from '../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../test/mocks/solana-keyring-accounts';
import type { FieldValidationFunction } from '../types/form';
import {
  amountInput,
  required,
  sendFieldsAreValid,
  validateField,
} from './form';

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
      tokenCaipId: KnownCaip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '100',
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolTestnet]: {
            amount: '123', // sender has 123 SOL, more than the amount to send
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
      minimumBalanceForRentExemptionSol: '0.002',
    } as unknown as SendContext;

    const result = sendFieldsAreValid(context);
    expect(result).toBe(true);
  });

  it('returns false when any field is invalid', () => {
    const context = {
      preferences: {
        locale: 'en',
      },
      tokenCaipId: KnownCaip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '', // amount is invalid
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolTestnet]: {
            amount: '123',
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
      minimumBalanceForRentExemptionSol: '0.002',
    } as unknown as SendContext;

    const result = sendFieldsAreValid(context);
    expect(result).toBe(false);
  });

  it('returns false when the amount is greater than the balance', () => {
    const contextWithInvalidBalance = {
      preferences: {
        locale: 'en',
      },
      tokenCaipId: KnownCaip19Id.SolTestnet,
      fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
      toAddress: MOCK_SOLANA_KEYRING_ACCOUNT_1.address,
      amount: '100',
      balances: {
        [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
          [KnownCaip19Id.SolTestnet]: {
            amount: '5', // sender has 5 SOL, but we're trying to send 100
          },
        },
      },
      currencyType: SendCurrencyType.TOKEN,
      minimumBalanceForRentExemptionSol: '0.002',
    } as unknown as SendContext;

    const result = sendFieldsAreValid(contextWithInvalidBalance);
    expect(result).toBe(false);
  });

  describe('amountInput', () => {
    it('returns null when the amount is valid', () => {
      const context = {
        preferences: {
          locale: 'en',
        },
        minimumBalanceForRentExemptionSol: '0.002',
      } as unknown as SendContext;

      const validator = amountInput(context);
      expect(validator('0.5')).toBeNull(); // 0.5 SOL is more than 0.002 SOL
    });

    it('returns an error with no message when the amount is 0', () => {
      const context = {
        preferences: {
          locale: 'en',
        },
        minimumBalanceForRentExemptionSol: '0.002',
      } as unknown as SendContext;

      const validator = amountInput(context);
      expect(validator('0')).toStrictEqual({
        message: '',
        value: '0',
      });
    });

    it('returns an error when the amount is less than the minimum balance for rent exemption', () => {
      const context = {
        preferences: {
          locale: 'en',
        },
        minimumBalanceForRentExemptionSol: '0.002',
      } as unknown as SendContext;

      const validator = amountInput(context);
      expect(validator('0.001')).toStrictEqual({
        message: 'Amount must be greater than 0.002',
        value: '0.001',
      });
    });
  });
});
