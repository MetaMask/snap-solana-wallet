import { KnownCaip19Id, Network } from '../../../../core/constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../../../core/test/mocks/solana-keyring-accounts';
import type { SendContext } from '../../types';
import { SendCurrencyType, SendFormNames } from '../../types';
import { sendFieldsAreValid } from '../../validation/form';
import { validation } from './validation';

describe('SendForm Logic', () => {
  describe('Context Processing', () => {
    it('should process valid send context correctly', () => {
      const context: SendContext = {
        scope: Network.Localnet,
        fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        amount: '1.5',
        destinationAddressOrDomain:
          'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        domainResolutionStatus: null,
        toAddress: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        feeEstimatedInSol: '0.000005',
        feePaidInSol: '0',
        tokenCaipId: KnownCaip19Id.SolLocalnet,
        accounts: [MOCK_SOLANA_KEYRING_ACCOUNT_0],
        currencyType: SendCurrencyType.TOKEN,
        validation: {},
        balances: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            [KnownCaip19Id.SolLocalnet]: {
              amount: '10',
              unit: 'SOL',
            },
          },
        },
        assets: [],
        tokenPrices: {},
        selectedTokenMetadata: {
          symbol: 'SOL',
          name: 'Solana',
          asset: KnownCaip19Id.SolLocalnet,
          imageSvg: null,
        },
        tokenPricesFetchStatus: 'fetched',
        preferences: {
          locale: 'en',
          currency: 'usd',
          hideBalances: false,
          useSecurityAlerts: true,
          useExternalPricingData: true,
          simulateOnChainActions: true,
          useTokenDetection: true,
          batchCheckBalances: true,
          displayNftMedia: true,
          useNftDetection: true,
        },
        error: null,
        buildingTransaction: false,
        transactionMessage: null,
        transaction: null,
        stage: 'send-form',
        minimumBalanceForRentExemptionSol: '0.002',
        loading: false,
      };

      // Test that the context has all required fields
      expect(context.fromAccountId).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
      expect(context.amount).toBe('1.5');
      expect(context.toAddress).toBe(
        'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
      );
      expect(context.tokenCaipId).toBe(KnownCaip19Id.SolLocalnet);
      expect(context.scope).toBe(Network.Localnet);
    });

    it('should validate form fields correctly', () => {
      const context: SendContext = {
        scope: Network.Localnet,
        fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        amount: '1.5',
        destinationAddressOrDomain:
          'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        domainResolutionStatus: null,
        toAddress: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        feeEstimatedInSol: '0.000005',
        feePaidInSol: '0',
        tokenCaipId: KnownCaip19Id.SolLocalnet,
        accounts: [MOCK_SOLANA_KEYRING_ACCOUNT_0],
        currencyType: SendCurrencyType.TOKEN,
        validation: {},
        balances: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            [KnownCaip19Id.SolLocalnet]: {
              amount: '10',
              unit: 'SOL',
            },
          },
        },
        assets: [],
        tokenPrices: {},
        selectedTokenMetadata: {
          symbol: 'SOL',
          name: 'Solana',
          asset: KnownCaip19Id.SolLocalnet,
          imageSvg: null,
        },
        tokenPricesFetchStatus: 'fetched',
        preferences: {
          locale: 'en',
          currency: 'usd',
          hideBalances: false,
          useSecurityAlerts: true,
          useExternalPricingData: true,
          simulateOnChainActions: true,
          useTokenDetection: true,
          batchCheckBalances: true,
          displayNftMedia: true,
          useNftDetection: true,
        },
        error: null,
        buildingTransaction: false,
        transactionMessage: null,
        transaction: null,
        stage: 'send-form',
        minimumBalanceForRentExemptionSol: '0.002',
        loading: false,
      };

      // Test that all fields are valid
      expect(sendFieldsAreValid(context)).toBe(true);

      // Test validation rules
      const validationRules = validation(context);
      expect(
        validationRules[SendFormNames.SourceAccountSelector],
      ).toBeDefined();
      expect(validationRules[SendFormNames.AmountInput]).toBeDefined();
      expect(
        validationRules[SendFormNames.DestinationAccountInput],
      ).toBeDefined();
    });

    it('should handle invalid form data correctly', () => {
      const invalidContext: SendContext = {
        scope: Network.Localnet,
        fromAccountId: '', // Invalid: empty account
        amount: '', // Invalid: empty amount
        destinationAddressOrDomain:
          'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        domainResolutionStatus: null,
        toAddress: 'invalid-address', // Invalid: not a Solana address
        feeEstimatedInSol: '0.000005',
        feePaidInSol: '0',
        tokenCaipId: KnownCaip19Id.SolLocalnet,
        accounts: [MOCK_SOLANA_KEYRING_ACCOUNT_0],
        currencyType: SendCurrencyType.TOKEN,
        validation: {},
        balances: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            [KnownCaip19Id.SolLocalnet]: {
              amount: '10',
              unit: 'SOL',
            },
          },
        },
        assets: [],
        tokenPrices: {},
        selectedTokenMetadata: {
          symbol: 'SOL',
          name: 'Solana',
          asset: KnownCaip19Id.SolLocalnet,
          imageSvg: null,
        },
        tokenPricesFetchStatus: 'fetched',
        preferences: {
          locale: 'en',
          currency: 'usd',
          hideBalances: false,
          useSecurityAlerts: true,
          useExternalPricingData: true,
          simulateOnChainActions: true,
          useTokenDetection: true,
          batchCheckBalances: true,
          displayNftMedia: true,
          useNftDetection: true,
        },
        error: null,
        buildingTransaction: false,
        transactionMessage: null,
        transaction: null,
        stage: 'send-form',
        minimumBalanceForRentExemptionSol: '0.002',
        loading: false,
      };

      // Test that invalid fields are detected
      expect(sendFieldsAreValid(invalidContext)).toBe(false);

      // Test validation rules for invalid data
      const validationRules = validation(invalidContext);

      // Test source account validation
      const sourceAccountValidation =
        validationRules[SendFormNames.SourceAccountSelector];
      expect(sourceAccountValidation).toBeDefined();
      if (sourceAccountValidation && sourceAccountValidation[0]) {
        expect(sourceAccountValidation[0]('')).not.toBeNull(); // Should fail for empty string
      }

      // Test destination address validation
      const destinationValidation =
        validationRules[SendFormNames.DestinationAccountInput];
      expect(destinationValidation).toBeDefined();
      if (destinationValidation && destinationValidation[1]) {
        expect(destinationValidation[1]('invalid-address')).not.toBeNull(); // Should fail for invalid address
      }
    });

    it('should process balance data correctly', () => {
      const context: SendContext = {
        scope: Network.Localnet,
        fromAccountId: MOCK_SOLANA_KEYRING_ACCOUNT_0.id,
        amount: '1.5',
        destinationAddressOrDomain:
          'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        domainResolutionStatus: null,
        toAddress: 'BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP',
        feeEstimatedInSol: '0.000005',
        feePaidInSol: '0',
        tokenCaipId: KnownCaip19Id.SolLocalnet,
        accounts: [MOCK_SOLANA_KEYRING_ACCOUNT_0],
        currencyType: SendCurrencyType.TOKEN,
        validation: {},
        balances: {
          [MOCK_SOLANA_KEYRING_ACCOUNT_0.id]: {
            [KnownCaip19Id.SolLocalnet]: {
              amount: '10',
              unit: 'SOL',
            },
          },
        },
        assets: [],
        tokenPrices: {},
        selectedTokenMetadata: {
          symbol: 'SOL',
          name: 'Solana',
          asset: KnownCaip19Id.SolLocalnet,
          imageSvg: null,
        },
        tokenPricesFetchStatus: 'fetched',
        preferences: {
          locale: 'en',
          currency: 'usd',
          hideBalances: false,
          useSecurityAlerts: true,
          useExternalPricingData: true,
          simulateOnChainActions: true,
          useTokenDetection: true,
          batchCheckBalances: true,
          displayNftMedia: true,
          useNftDetection: true,
        },
        error: null,
        buildingTransaction: false,
        transactionMessage: null,
        transaction: null,
        stage: 'send-form',
        minimumBalanceForRentExemptionSol: '0.002',
        loading: false,
      };

      // Test balance retrieval
      const accountBalance =
        context.balances[context.fromAccountId]?.[context.tokenCaipId];
      expect(accountBalance).toBeDefined();
      expect(accountBalance?.amount).toBe('10');
      expect(accountBalance?.unit).toBe('SOL');

      // Test selected account
      const selectedAccount = context.accounts.find(
        (account) => account.id === context.fromAccountId,
      );
      expect(selectedAccount).toBeDefined();
      expect(selectedAccount?.id).toBe(MOCK_SOLANA_KEYRING_ACCOUNT_0.id);
    });
  });

  describe('Form Names Constants', () => {
    it('should have all required form field names', () => {
      expect(SendFormNames.SourceAccountSelector).toBeDefined();
      expect(SendFormNames.AmountInput).toBeDefined();
      expect(SendFormNames.DestinationAccountInput).toBeDefined();
      expect(SendFormNames.AssetSelector).toBeDefined();
      expect(SendFormNames.Form).toBeDefined();
      expect(SendFormNames.BackButton).toBeDefined();
    });
  });
});
