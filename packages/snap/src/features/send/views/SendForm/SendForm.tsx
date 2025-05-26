import {
  AssetSelector,
  Banner,
  Box,
  Button,
  Container,
  Field,
  Footer,
  Form,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { isNullOrUndefined } from '@metamask/utils';

import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCrypto } from '../../../../core/utils/formatCrypto';
import { formatFiat } from '../../../../core/utils/formatFiat';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { AccountSelector } from '../../components/AccountSelector/AccountSelector';
import { AmountInput } from '../../components/AmountInput/AmountInput';
import { ToAddressField } from '../../components/ToAddressField/ToAddressField';
import { getNativeTokenPrice, getSelectedTokenPrice } from '../../selectors';
import { SendCurrencyType, SendFormNames, type SendContext } from '../../types';

type SendFormProps = {
  context: SendContext;
  inputToAddress?: string;
  inputAmount?: string;
};

export const SendForm = ({
  context,
  inputToAddress,
  inputAmount,
}: SendFormProps) => {
  const {
    accounts,
    fromAccountId,
    amount,
    toAddress,
    validation,
    currencyType,
    tokenCaipId,
    scope,
    balances,
    tokenPricesFetchStatus,
    buildingTransaction,
    error,
    loading,
    transactionMessage,
    preferences: { locale, currency },
  } = context;

  console.log('🍋transactionMessage', transactionMessage);

  console.log('🍋balances', balances);
  const translate = i18n(locale);
  const selectedToken = balances[fromAccountId]?.[tokenCaipId];
  console.log('🍋selectedToken', selectedToken);
  const tokenBalance = selectedToken?.amount;
  console.log('🍋tokenBalance', tokenBalance);
  const tokenSymbol = selectedToken?.unit ?? '';
  console.log('🍋tokenSymbol', tokenSymbol);
  const isBalanceDefined = tokenBalance !== undefined;
  console.log('🍋isBalanceDefined', isBalanceDefined);

  const selectedAccount = accounts.find(
    (account) => account.id === fromAccountId,
  );
  const selectedAccountAddress = selectedAccount?.address
    ? addressToCaip10(scope, selectedAccount.address)
    : '';

  const nativePrice = getNativeTokenPrice(context);
  const selectedTokenPrice = getSelectedTokenPrice(context);

  const balanceUndefinedOrZero =
    tokenBalance === undefined || tokenBalance === '0';
  const selectedTokenPriceUnavailable = selectedTokenPrice === undefined;
  const showTokenPriceMessage =
    tokenPricesFetchStatus === 'error' ||
    (tokenPricesFetchStatus === 'fetched' && selectedTokenPriceUnavailable);

  const currencyToBalance: Record<SendCurrencyType, string> = isBalanceDefined
    ? {
        [SendCurrencyType.FIAT]: formatFiat(
          tokenToFiat(tokenBalance, selectedTokenPrice ?? 0),
          currency,
          locale,
        ),
        [SendCurrencyType.TOKEN]: formatCrypto(
          tokenBalance,
          tokenSymbol,
          locale,
        ),
      }
    : {
        [SendCurrencyType.FIAT]: '',
        [SendCurrencyType.TOKEN]: '',
      };

  const balance = currencyToBalance[currencyType];

  const canPickAmout =
    fromAccountId.length > 0 &&
    (toAddress ? toAddress.length > 0 : false) &&
    isNullOrUndefined(validation?.[SendFormNames.DestinationAccountInput]);

  const isTransactionMessageSuccessfullyBuild =
    !isNullOrUndefined(transactionMessage) && transactionMessage !== '';

  const showClearAddressButton = Boolean(toAddress && toAddress.length > 0);

  const canReview =
    fromAccountId.length > 0 &&
    (amount ? amount.length > 0 : false) &&
    (toAddress ? toAddress.length > 0 : false) &&
    Object.values(validation).every(isNullOrUndefined) &&
    isBalanceDefined &&
    !buildingTransaction &&
    isTransactionMessageSuccessfullyBuild;

  return (
    <Container backgroundColor="alternative">
      <Box>
        <Navigation
          title={translate('send.title')}
          backButtonName={SendFormNames.BackButton}
        />
        <Form name={SendFormNames.Form}>
          {showTokenPriceMessage && (
            <Banner title="" severity="info">
              <Text>
                {translate('send.selectedTokenPriceNotAvailable', {
                  currency,
                })}
              </Text>
            </Banner>
          )}
          <Box>{null}</Box>
          <Box>{null}</Box>
          <Box>{null}</Box>
          <AccountSelector
            name={SendFormNames.SourceAccountSelector}
            scope={scope}
            error={
              validation?.[SendFormNames.SourceAccountSelector]?.message ?? ''
            }
            accounts={accounts}
            selectedAccountId={fromAccountId}
            balances={balances}
            price={nativePrice ?? null}
            locale={locale}
            currency={currency}
          />
          <Box>{null}</Box>
          <Box>{null}</Box>
          <Box>{null}</Box>
          <ToAddressField
            locale={locale}
            disabled={loading}
            name={SendFormNames.DestinationAccountInput}
            value={inputToAddress ?? null}
            showClearButton={showClearAddressButton}
            error={
              validation?.[SendFormNames.DestinationAccountInput]?.message ?? ''
            }
          />
          {canPickAmout && (
            <Box>
              <Box>{null}</Box>
              <Box>{null}</Box>
              <Box>{null}</Box>
              <Box direction="horizontal">
                <Field label={translate('send.assetField')}>
                  <AssetSelector
                    chainIds={[scope]}
                    value={tokenCaipId}
                    name={SendFormNames.AssetSelector}
                    addresses={
                      selectedAccountAddress ? [selectedAccountAddress] : []
                    }
                  />
                </Field>
                <AmountInput
                  name={SendFormNames.AmountInput}
                  error={validation?.[SendFormNames.AmountInput]?.message ?? ''}
                  currencyType={currencyType}
                  tokenSymbol={tokenSymbol}
                  currency={currency}
                  value={inputAmount ?? null}
                  locale={locale}
                  swapCurrencyButtonDisabled={
                    selectedTokenPriceUnavailable || balanceUndefinedOrZero
                  }
                />
              </Box>
              <Box direction="horizontal" alignment="space-between" center>
                {balance ? (
                  <Text size="sm" color="muted">{`${translate(
                    'send.balance',
                  )}: ${balance}`}</Text>
                ) : (
                  <Box>{null}</Box>
                )}
                <Button
                  size="sm"
                  name={SendFormNames.MaxAmountButton}
                  disabled={balanceUndefinedOrZero}
                >
                  {translate('send.maxButton')}
                </Button>
              </Box>
            </Box>
          )}
          {error && (
            <Box>
              <Box>{null}</Box>
              <Banner title={translate(error.title)} severity="warning">
                <Text>{translate(error.message)}</Text>
              </Banner>
            </Box>
          )}
        </Form>
      </Box>
      <Footer>
        <Button name={SendFormNames.CancelButton}>
          {translate('send.cancelButton')}
        </Button>
        <Button
          name={SendFormNames.SendButton}
          disabled={!canReview}
          loading={buildingTransaction}
        >
          {translate('send.continueButton')}
        </Button>
      </Footer>
    </Container>
  );
};
