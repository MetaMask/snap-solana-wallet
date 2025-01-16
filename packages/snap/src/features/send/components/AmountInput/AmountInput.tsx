import {
  Box,
  Button,
  Field,
  Icon,
  Input,
  Text,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { i18n, type Locale } from '../../../../core/utils/i18n';
import { SendCurrencyType, SendFormNames } from '../../types';

type AmountInputProps = {
  name: string;
  value: string;
  tokenSymbol: string;
  currency: string;
  currencyType: SendCurrencyType;
  locale: Locale;
  error?: string;
};

export const AmountInput: SnapComponent<AmountInputProps> = ({
  name,
  value,
  tokenSymbol,
  currency,
  currencyType,
  error,
  locale,
}) => {
  const translate = i18n(locale);
  const symbol =
    currencyType === SendCurrencyType.FIAT
      ? currency.toUpperCase()
      : tokenSymbol;

  return (
    <Field label={translate('send.amountField')} error={error}>
      <Input
        name={name}
        type="number"
        min={0}
        placeholder="0"
        step={0.01}
        value={value}
      />
      <Box direction="horizontal" center>
        <Box direction="vertical" alignment="center">
          <Text size="sm">{symbol}</Text>
        </Box>
        <Button name={SendFormNames.SwapCurrencyButton}>
          <Icon name="swap-vertical" color="primary" size="md" />
        </Button>
      </Box>
    </Field>
  );
};
