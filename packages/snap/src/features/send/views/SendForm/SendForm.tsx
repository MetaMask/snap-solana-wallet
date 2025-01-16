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
import { Networks } from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { AccountSelector } from '../../components/AccountSelector/AccountSelector';
import { AmountInput } from '../../components/AmountInput/AmountInput';
import { AssetSelector } from '../../components/AssetsSelector/AssetsSelector';
import { ToAddressField } from '../../components/ToAddressField/ToAddressField';
import { SendCurrencyType, SendFormNames, type SendContext } from '../../types';

type SendFormProps = {
  context: SendContext;
};

export const SendForm = ({
  context: {
    accounts,
    fromAccountId,
    amount,
    toAddress,
    validation,
    currencyType,
    tokenCaipId,
    scope,
    balances,
    tokenPrices,
    tokenMetadata,
    buildingTransaction,
    error,
    preferences: { locale, currency },
  },
}: SendFormProps) => {
  const translate = i18n(locale);
  const selectedToken = balances[fromAccountId]?.[tokenCaipId];
  const tokenBalance = selectedToken?.amount;
  const tokenSymbol = selectedToken?.unit ?? '';
  const isBalanceDefined = tokenBalance !== undefined;
  const { price: nativePrice } = tokenPrices?.[
    Networks[scope].nativeToken.caip19Id
  ] ?? {
    price: 0,
  };

  const { price: tokenPrice } = tokenPrices?.[tokenCaipId] ?? {
    price: 0,
  };

  const currencyToBalance: Record<SendCurrencyType, string> = isBalanceDefined
    ? {
        [SendCurrencyType.FIAT]: formatCurrency(
          tokenToFiat(tokenBalance, tokenPrice),
          currency,
        ),
        [SendCurrencyType.TOKEN]: formatTokens(tokenBalance, tokenSymbol),
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
    isBalanceDefined &&
    Boolean(tokenPrice);

  return (
    <Container>
      <Box>
        <Navigation
          title={translate('send.title')}
          backButtonName={SendFormNames.BackButton}
        />
        <Form name={SendFormNames.Form}>
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
            price={nativePrice}
            locale={locale}
            currency={currency}
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
                <Button size="sm" name={SendFormNames.MaxAmountButton}>
                  {translate('send.maxButton')}
                </Button>
              </Box>
            </Box>
          )}
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
