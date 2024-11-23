import {
  Box,
  Button,
  Field,
  Icon,
  IconName,
  Input,
} from '@metamask/snaps-sdk/jsx';

import type { FormFieldError } from '../../../../core/types/error';
import { SendFormNames } from '../../types/form';

type ToAddressFieldProps = {
  validation: Partial<Record<SendFormNames, FormFieldError>>;
  clearToField: boolean;
  showClearButton: boolean;
};

export const ToAddressField = ({
  validation,
  clearToField,
  showClearButton,
}: ToAddressFieldProps) => (
  <Field label="To" error={validation?.[SendFormNames.To]?.message ?? ''}>
    <Input
      name={SendFormNames.To}
      placeholder="Enter public address"
      value={clearToField ? '' : undefined}
    />
    {showClearButton && (
      <Box>
        <Button name={SendFormNames.Clear}>
          <Icon name={IconName.Close} color="primary" />
        </Button>
      </Box>
    )}
  </Field>
);
