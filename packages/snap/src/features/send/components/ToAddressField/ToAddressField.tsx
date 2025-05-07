import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
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
  showClearButton: boolean;
};

export const ToAddressField: SnapComponent<ToAddressFieldProps> = ({
  name,
  value,
  error,
  locale,
  showClearButton,
}) => {
  const translate = i18n(locale);

  return (
    <Field label={translate('send.toField')} error={error}>
      <Input
        name={name}
        placeholder={translate('send.toPlaceholder')}
        value={value ?? undefined}
      />
      {showClearButton ? (
        <Box>
          <Button name={SendFormNames.ClearButton}>
            <Icon name={IconName.Close} color="primary" />
          </Button>
        </Box>
      ) : null}
    </Field>
  );
};
