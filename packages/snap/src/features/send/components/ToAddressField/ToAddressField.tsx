import {
  Box,
  Button,
  Field,
  Icon,
  IconName,
  Input,
} from '@metamask/snaps-sdk/jsx';

import { SendFormNames } from '../../views/SendForm/types';

type ToAddressFieldProps = {
  name: string;
  value: string;
  error: string;
};

export const ToAddressField = ({ name, value, error }: ToAddressFieldProps) => {
  const showClearButton = value.length > 0;

  return (
    <Field label="To" error={error}>
      <Input name={name} placeholder="Enter public address" value={value} />
      {showClearButton && (
        <Box>
          <Button name={SendFormNames.ClearButton}>
            <Icon name={IconName.Close} color="primary" />
          </Button>
        </Box>
      )}
    </Field>
  );
};
