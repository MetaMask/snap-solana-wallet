import type { SnapComponent, TextColors } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Field,
  Icon,
  IconName,
  Input,
  Text,
} from '@metamask/snaps-sdk/jsx';

import type { FetchStatus } from '../../../../core/types/snap';
import { i18n, type Locale } from '../../../../core/utils/i18n';
import { SendFormNames } from '../../types';

type ToAddressFieldProps = {
  name: string;
  value: string | null;
  error: string;
  locale: Locale;
  showClearButton: boolean;
  disabled: boolean;
  domainResolutionStatus: FetchStatus | null;
};

const domainResolutionStatusToTextColor: Record<
  FetchStatus,
  TextColors | null
> = {
  initial: null,
  fetching: 'default',
  fetched: 'success',
  error: null,
};

export const ToAddressField: SnapComponent<ToAddressFieldProps> = ({
  name,
  value,
  error,
  locale,
  showClearButton,
  disabled,
  domainResolutionStatus,
}) => {
  const translate = i18n(locale);

  return (
    <Box>
      <Field label={translate('send.toField')} error={error}>
        <Input
          name={name}
          placeholder={disabled ? '' : translate('send.toPlaceholder')}
          value={value ?? undefined}
          disabled={disabled}
        />
        {showClearButton ? (
          <Box>
            <Button name={SendFormNames.ClearButton}>
              <Icon name={IconName.Close} color="primary" />
            </Button>
          </Box>
        ) : null}
      </Field>
      {domainResolutionStatus &&
        domainResolutionStatusToTextColor[domainResolutionStatus] !== null && (
          <Text
            size="sm"
            color={domainResolutionStatusToTextColor[domainResolutionStatus]}
          >
            {translate(
              `send.toDomainResolutionStatus.${domainResolutionStatus}`,
            )}
          </Text>
        )}
    </Box>
  );
};
