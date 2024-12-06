import {
  Box,
  Button,
  Field,
  Icon,
  Image,
  Input,
  Text,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import solanaIcon from '../../../../../images/coin.svg';
import { SendFormNames } from '../../types';

type AmountInputProps = {
  name: string;
  value: string;
  currencySymbol: string;
  error?: string;
};

export const AmountInput: SnapComponent<AmountInputProps> = ({
  name,
  value,
  currencySymbol,
  error,
}) => {
  return (
    <Field label="" error={error}>
      <Box direction="horizontal" center>
        <Image src={solanaIcon} />
      </Box>
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
          <Text>{currencySymbol}</Text>
        </Box>
        <Button name={SendFormNames.SwapCurrencyButton}>
          <Icon name="swap-vertical" color="primary" size="md" />
        </Button>
      </Box>
    </Field>
  );
};
