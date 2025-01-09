import {
  Box,
  Button,
  Container,
  Footer,
  Form,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { isNullOrUndefined } from '@metamask/utils';

import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { Caip19Id } from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { AccountSelector } from '../../components/AccountSelector/AccountSelector';
import { AmountInput } from '../../components/AmountInput/AmountInput';
import { ToAddressField } from '../../components/ToAddressField/ToAddressField';
import { SendCurrency, SendFormNames, type SendContext } from '../../types';

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
    currencySymbol,
    scope,
    balances,
    tokenPrices,
    preferences: { locale, currency },
  },
}: SendFormProps) => {
  const translate = i18n(locale);
  const nativeBalance = balances[fromAccountId]?.amount;
  const isNativeBalanceDefined = nativeBalance !== undefined;

  // FIXME: for now, always use mainnet for prices
  const { price } = tokenPrices[Caip19Id.SolMainnet] ?? { price: 0 };

  const currencyToBalance: Record<SendCurrency, string> = isNativeBalanceDefined
    ? {
        [SendCurrency.FIAT]: formatCurrency(
          tokenToFiat(nativeBalance, price),
          currency,
        ),
        [SendCurrency.SOL]: formatTokens(nativeBalance, currencySymbol),
      }
    : {
        [SendCurrency.FIAT]: '',
        [SendCurrency.SOL]: '',
      };

  const balance = currencyToBalance[currencySymbol];

  const canPickAmout =
    fromAccountId.length > 0 &&
    toAddress.length > 0 &&
    isNullOrUndefined(validation?.[SendFormNames.DestinationAccountInput]);

  const canReview =
    fromAccountId.length > 0 &&
    amount.length > 0 &&
    toAddress.length > 0 &&
    Object.values(validation).every(isNullOrUndefined) &&
    isNativeBalanceDefined &&
    Boolean(price);

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
            price={price}
            locale={locale}
            currency={currency}
          />
          {canPickAmout && (
            <Box>
              <Box>{null}</Box>
              <Box>{null}</Box>
              <Box>{null}</Box>
              <AmountInput
                name={SendFormNames.AmountInput}
                error={validation?.[SendFormNames.AmountInput]?.message ?? ''}
                currencySymbol={currencySymbol}
                value={amount}
              />
              <Box direction="horizontal" alignment="space-between" center>
                {balance ? (
                  <Text color="muted">{`${translate(
                    'send.balance',
                  )}: ${balance}`}</Text>
                ) : (
                  <Box>{null}</Box>
                )}
                <Button name={SendFormNames.MaxAmountButton}>
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
        </Form>
        <Button name={SendFormNames.TransferUsdcButton}>Transfer USDC</Button>
      </Box>
      <Footer>
        <Button name={SendFormNames.CancelButton}>
          {translate('send.cancelButton')}
        </Button>
        <Button name={SendFormNames.SendButton} disabled={!canReview}>
          {translate('send.continueButton')}
        </Button>
      </Footer>
    </Container>
  );
};
