import { KnownCaip19Id, Network } from '../../../core/constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
} from '../../../core/test/mocks/solana-keyring-accounts';
import type { FieldValidationFunction } from '../../../core/types/form';
import type { SendContext } from '../types';
import { SendCurrencyType } from '../types';
import {
  amountInput,
  required,
  sendFieldsAreValid,
  validateField,
} from './form';

describe('send form validation', () => {
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
        scope: Network.Testnet,
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
        scope: Network.Testnet,
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
        scope: Network.Testnet,
      } as unknown as SendContext;

      const result = sendFieldsAreValid(contextWithInvalidBalance);
      expect(result).toBe(false);
    });
  });

  describe('amountInput', () => {
    describe('when sending native SOL', () => {
      const createSolContext = (overrides = {}) =>
        ({
          preferences: { locale: 'en' },
          fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          tokenCaipId: KnownCaip19Id.SolTestnet,
          minimumBalanceForRentExemptionSol: '0.002',
          scope: Network.Testnet,
          currencyType: SendCurrencyType.TOKEN,
          feeEstimatedInSol: '0.000005',
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [KnownCaip19Id.SolTestnet]: {
                amount: '1', // Sender has 1 SOL by default
              },
            },
          },
          ...overrides,
        }) as unknown as SendContext;

      it('returns an error with no message when the amount is empty string', () => {
        const context = createSolContext();
        const validator = amountInput(context);
        expect(validator('')).toStrictEqual({
          message: '',
          value: '',
        });
      });

      it('returns null when the amount is valid', () => {
        const context = createSolContext();
        const validator = amountInput(context);
        expect(validator('0.5')).toBeNull();
      });

      it('returns an error with no message when the amount is 0', () => {
        const context = createSolContext();
        const validator = amountInput(context);
        expect(validator('0')).toStrictEqual({
          message: '',
          value: '0',
        });
      });

      it('returns an error when the amount is greater than the balance', () => {
        const context = createSolContext();
        const validator = amountInput(context);
        expect(validator('1.5')).toStrictEqual({
          message: 'Insufficient balance',
          value: '1.5',
        });
      });

      it('returns an error when the amount is less than the minimum balance for rent exemption', () => {
        const context = createSolContext();
        const validator = amountInput(context);
        expect(validator('0.001')).toStrictEqual({
          message: 'Amount must be greater than 0.002',
          value: '0.001',
        });
      });

      it('considers transaction fees and rent exemption when validating balance', () => {
        const context = createSolContext({
          feeEstimatedInSol: '0.1',
          minimumBalanceForRentExemptionSol: '0.05',
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [KnownCaip19Id.SolTestnet]: {
                amount: '1',
              },
            },
          },
        });

        const validator = amountInput(context);
        // 0.9 + 0.1 fee + 0.05 rent exemption > 1 SOL balance
        expect(validator('0.9')).toStrictEqual({
          message: 'Insufficient SOL balance to cover the transaction fee',
          value: '0.9',
        });

        // 0.8 + 0.1 fee + 0.05 rent exemption < 1 SOL balance (0.95 total)
        expect(validator('0.8')).toBeNull();
      });
    });

    describe('when sending SPL token', () => {
      const createSplContext = (overrides = {}) =>
        ({
          preferences: { locale: 'en' },
          fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
          tokenCaipId: KnownCaip19Id.EurcDevnet,
          minimumBalanceForRentExemptionSol: '0.002',
          scope: Network.Testnet,
          currencyType: SendCurrencyType.TOKEN,
          feeEstimatedInSol: '0.000005',
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [KnownCaip19Id.EurcDevnet]: {
                amount: '100', // Sender has 100 EURC by default
              },
              [KnownCaip19Id.SolTestnet]: {
                amount: '1', // Sender has 1 SOL for fees by default
              },
            },
          },
          ...overrides,
        }) as unknown as SendContext;

      it('returns an error with no message when the amount is empty string', () => {
        const context = createSplContext();
        const validator = amountInput(context);
        expect(validator('')).toStrictEqual({
          message: '',
          value: '',
        });
      });

      it('returns null when the amount is valid', () => {
        const context = createSplContext();
        const validator = amountInput(context);
        expect(validator('50')).toBeNull();
      });

      it('returns an error with no message when the amount is 0', () => {
        const context = createSplContext();
        const validator = amountInput(context);
        expect(validator('0')).toStrictEqual({
          message: '',
          value: '0',
        });
      });

      it('does not compare the amount to the minimum balance for rent exemption', () => {
        const context = createSplContext();
        const validator = amountInput(context);
        expect(validator('0.001')).toBeNull();
      });

      it('returns an error when the token amount is greater than the balance', () => {
        const context = createSplContext();
        const validator = amountInput(context);
        expect(validator('150')).toStrictEqual({
          message: 'Insufficient balance',
          value: '150',
        });
      });

      it('returns an error when SOL balance is insufficient for fees', () => {
        const context = createSplContext({
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [KnownCaip19Id.EurcDevnet]: {
                amount: '100',
              },
              [KnownCaip19Id.SolTestnet]: {
                amount: '0.000001', // Not enough SOL for fees
              },
            },
          },
          feeEstimatedInSol: '0.00001',
        });

        const validator = amountInput(context);
        expect(validator('50')).toStrictEqual({
          message: 'Insufficient SOL balance to cover the transaction fee',
          value: '50',
        });
      });

      it('returns an error when paying the fee would drop the balance below the minimum balance for rent exemption', () => {
        const context = createSplContext({
          balances: {
            [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
              [KnownCaip19Id.EurcDevnet]: {
                amount: '100',
              },
              [KnownCaip19Id.SolTestnet]: {
                amount: '0.002', // Enough SOL to pay for the fee, but balance would drop below the rent (fee = 0.000005 SOL, rent exemption = 0.002 SOL)
              },
            },
          },
        });

        const validator = amountInput(context);
        expect(validator('50')).toStrictEqual({
          message: 'Insufficient SOL balance to cover the transaction fee',
          value: '50',
        });
      });
    });
  });
});
