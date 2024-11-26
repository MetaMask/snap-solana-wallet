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
import { SendFormNames } from '../../types/form';

type AmountInputProps = {
  error?: string;
  currencySymbol: string;
  maxBalance: string | null;
};

export const AmountInput: SnapComponent<AmountInputProps> = ({
  error,
  currencySymbol,
  maxBalance,
}) => {
  return (
    <Field label="" error={error}>
      <Box direction="horizontal" center>
        <Image src={solanaIcon} />
      </Box>
      <Input
        name={SendFormNames.AmountInput}
        type="number"
        min={0}
        step={0.00000001}
        placeholder="0"
        value={maxBalance ?? undefined}
      />
      <Box direction="horizontal" center>
        <Box direction="vertical" alignment="center">
          <Text>{currencySymbol}</Text>
        </Box>
        <Button name={SendFormNames.SwapCurrency}>
          <Icon name="swap-vertical" color="primary" size="md" />
        </Button>
      </Box>
    </Field>
  );
};
