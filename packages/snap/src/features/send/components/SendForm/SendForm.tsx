import {
  Box,
  Button,
  Container,
  Footer,
  Form,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { Header } from '../../../../core/components/Header/Header';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { SendFormNames } from '../../types/form';
import { SendCurrency, type SendContext } from '../../types/send';
import { AccountSelector } from '../AccountSelector/AccountSelector';
import { AmountInput } from '../AmountInput/AmountInput';
import { ToAddressField } from '../ToAddressField/ToAddressField';

type SendFormProps = {
  context: SendContext;
};

export const SendForm = ({
  context: {
    accounts,
    selectedAccountId,
    validation,
    clearToField,
    showClearButton,
    currencySymbol,
    scope,
    balances,
    rates,
    maxBalance,
    canReview,
    locale,
  },
}: SendFormProps) => {
  const translate = i18n(locale);

  const nativeBalance = balances[selectedAccountId]?.amount ?? '0';
  const currencyToMaxBalance: Record<SendCurrency, string> = {
    [SendCurrency.FIAT]: String(
      tokenToFiat(nativeBalance, rates?.conversionRate ?? 0),
    ),
    [SendCurrency.SOL]: nativeBalance,
  };

  const currencyToBalance: Record<SendCurrency, string> = {
    [SendCurrency.FIAT]: formatCurrency(
      tokenToFiat(nativeBalance, rates?.conversionRate ?? 0),
    ),
    [SendCurrency.SOL]: formatTokens(nativeBalance, currencySymbol),
  };

  const balance = currencyToBalance[currencySymbol];

  return (
    <Container>
      <Box>
        <Header title="Send" backButtonName={SendFormNames.BackButton} />
        <Form name={SendFormNames.Form}>
          <AccountSelector
            scope={scope}
            error={validation?.[SendFormNames.AccountSelector]?.message ?? ''}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            balances={balances}
            rates={rates}
          />
          <AmountInput
            error={validation?.[SendFormNames.AmountInput]?.message ?? ''}
            currencySymbol={currencySymbol}
            maxBalance={
              maxBalance ? currencyToMaxBalance[currencySymbol] : null
            }
          />
          <Box direction="horizontal" alignment="space-between" center>
            {balance ? (
              <Text color="muted">{`${translate(
                'send.balance',
              )}: ${balance}`}</Text>
            ) : (
              <Box>{null}</Box>
            )}
            <Button name={SendFormNames.AmountInputMax}>Max</Button>
          </Box>
          <ToAddressField
            validation={validation}
            clearToField={clearToField}
            showClearButton={showClearButton}
          />
        </Form>
      </Box>
      <Footer>
        <Button name={SendFormNames.Cancel}>Cancel</Button>
        <Button name={SendFormNames.Send} disabled={!canReview}>
          Send
        </Button>
      </Footer>
    </Container>
  );
};
