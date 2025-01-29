import {
  Banner,
  Box,
  Button,
  Container,
  Footer,
  Form,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { isNullOrUndefined } from '@metamask/utils';

import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { AccountSelector } from '../../components/AccountSelector/AccountSelector';
import { AmountInput } from '../../components/AmountInput/AmountInput';
import { AssetSelector } from '../../components/AssetsSelector/AssetsSelector';
import { ToAddressField } from '../../components/ToAddressField/ToAddressField';
import { getNativeTokenPrice, getSelectedTokenPrice } from '../../selectors';
import { SendCurrencyType, SendFormNames, type SendContext } from '../../types';

type SendFormProps = {
  context: SendContext;
};

export const SendForm = ({ context }: SendFormProps) => {
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
    tokenMetadata,
    buildingTransaction,
    error,
    preferences: { locale, currency },
  } = context;
  const translate = i18n(locale);
  const selectedToken = balances[fromAccountId]?.[tokenCaipId];
  const tokenBalance = selectedToken?.amount;
  const tokenSymbol = selectedToken?.unit ?? '';
  const isBalanceDefined = tokenBalance !== undefined;

  const nativePrice = getNativeTokenPrice(context);
  const selectedTokenPrice = getSelectedTokenPrice(context);

  const isSelectedTokenPriceUnavailable =
    tokenPricesFetchStatus === 'error' ||
    (tokenPricesFetchStatus === 'fetched' && selectedTokenPrice === undefined);

  const currencyToBalance: Record<SendCurrencyType, string> = isBalanceDefined
    ? {
        [SendCurrencyType.FIAT]: formatCurrency(
          tokenToFiat(tokenBalance, selectedTokenPrice ?? 0),
          currency,
        ),
        [SendCurrencyType.TOKEN]: formatTokens(
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
    toAddress.length > 0 &&
    isNullOrUndefined(validation?.[SendFormNames.DestinationAccountInput]);

  const canReview =
    fromAccountId.length > 0 &&
    amount.length > 0 &&
    toAddress.length > 0 &&
    Object.values(validation).every(isNullOrUndefined) &&
    isBalanceDefined;

  return (
    <Container>
      <Box>
        <Navigation
          title={translate('send.title')}
          backButtonName={SendFormNames.BackButton}
        />
        <Form name={SendFormNames.Form}>
          {isSelectedTokenPriceUnavailable && (
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
            price={nativePrice ?? null} // Cannot pass undefined here so we switch to null
            locale={locale}
            currency={currency}
          />
          <Box>{null}</Box>
          <Box>{null}</Box>
          <Box>{null}</Box>
          <ToAddressField
            locale={locale}
            name={SendFormNames.DestinationAccountInput}
            value={toAddress}
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
                <AssetSelector
                  tokenCaipId={tokenCaipId}
                  tokenMetadata={tokenMetadata}
                  selectedAccountId={fromAccountId}
                  balances={balances}
                  locale={locale}
                />
                <AmountInput
                  name={SendFormNames.AmountInput}
                  error={validation?.[SendFormNames.AmountInput]?.message ?? ''}
                  currencyType={currencyType}
                  tokenSymbol={tokenSymbol}
                  currency={currency}
                  value={amount}
                  locale={locale}
                  swapCurrencyButtonDisabled={isSelectedTokenPriceUnavailable}
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
                  disabled={tokenBalance === '0'}
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
          disabled={!canReview || buildingTransaction}
          loading={buildingTransaction}
        >
          {translate('send.continueButton')}
        </Button>
      </Footer>
    </Container>
  );
};
