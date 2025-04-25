import {
  Box,
  Button,
  Field,
  Icon,
  IconName,
  Input,
} from '@metamask/snaps-sdk/jsx';

import { i18n, type Locale } from '../../../../core/utils/i18n';
import { SendFormNames } from '../../types';

type ToAddressFieldProps = {
  name: string;
  value: string | null;
  error: string;
  locale: Locale;
};

export const ToAddressField = ({
  name,
  value,
  error,
  locale,
}: ToAddressFieldProps) => {
  const translate = i18n(locale);
  const showClearButton = value ? value.length > 0 : false;

  return (
    <Field label={translate('send.toField')} error={error}>
      <Input
        name={name}
        placeholder={translate('send.toPlaceholder')}
        value={value ?? undefined}
      />
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
