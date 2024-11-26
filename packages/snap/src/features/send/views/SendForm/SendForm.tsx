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
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { AccountSelector } from '../../components/AccountSelector/AccountSelector';
import { AmountInput } from '../../components/AmountInput/AmountInput';
import { ToAddressField } from '../../components/ToAddressField/ToAddressField';
import { SendCurrency, SendFormNames, type SendContext } from './types';

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
    rates,
    maxBalance,
  },
}: SendFormProps) => {
  const nativeBalance = balances[fromAccountId]?.amount ?? '0';
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

  const canReview =
    fromAccountId.length > 0 &&
    toAddress.length > 0 &&
    !Object.values(validation).every(Boolean);

  return (
    <Container>
      <Box>
        <Header title="Send" backButtonName={SendFormNames.BackButton} />
        <Form name={SendFormNames.Form}>
          <AccountSelector
            name={SendFormNames.SourceAccountSelector}
            scope={scope}
            error={
              validation?.[SendFormNames.SourceAccountSelector]?.message ?? ''
            }
            accounts={accounts}
            selectedAccountId={fromAccountId}
            balances={balances}
            currencyRate={rates}
          />
          <AmountInput
            name={SendFormNames.AmountInput}
            error={validation?.[SendFormNames.AmountInput]?.message ?? ''}
            currencySymbol={currencySymbol}
            value={amount}
          />
          <Box direction="horizontal" alignment="space-between" center>
            {balance ? (
              <Text color="muted">{`Balance: ${balance}`}</Text>
            ) : (
              <Box>{null}</Box>
            )}
            <Button name={SendFormNames.MaxAmountButton}>Max</Button>
          </Box>
          <ToAddressField
            name={SendFormNames.DestinationAccountInput}
            value={toAddress}
            error={
              validation?.[SendFormNames.DestinationAccountInput]?.message ?? ''
            }
          />
        </Form>
      </Box>
      <Footer>
        <Button name={SendFormNames.CancelButton}>Cancel</Button>
        <Button name={SendFormNames.SendButton} disabled={!canReview}>
          Send
        </Button>
      </Footer>
    </Container>
  );
};
