import {
  Banner,
  Box,
  Icon,
  Link,
  Text,
  type BannerProps,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/domain';
import type {
  TransactionScanError,
  TransactionScanValidation,
} from '../../../../core/services/transaction-scan/types';
import { i18n } from '../../../../core/utils/i18n';
import type { FetchStatus } from '../../../../types';
import { getErrorMessage } from './getErrorMessage';

type TransactionAlertProps = {
  preferences: Preferences;
  validation: TransactionScanValidation | null;
  error: TransactionScanError | null;
  scanFetchStatus: FetchStatus;
};

const VALIDATION_TYPE_TO_SEVERITY: Partial<
  Record<TransactionScanValidation['type'], BannerProps['severity']>
> = {
  Malicious: 'danger',
  Warning: 'warning',
};

export const TransactionAlert: SnapComponent<TransactionAlertProps> = ({
  preferences,
  validation,
  error,
  scanFetchStatus,
}) => {
  const translate = i18n(preferences.locale);

  /**
   * Displays a warning banner if the transaction scan fails.
   */
  if (scanFetchStatus === 'error') {
    return (
      <Banner
        title={translate('send.simulationTitleAPIError')}
        severity="danger"
      >
        <Text>{translate('send.simulationMessageAPIError')}</Text>
      </Banner>
    );
  }

  /**
   * Displays nothing if there is no error or validation.
   */
  if (!error && !validation) {
    return <Box>{null}</Box>;
  }

  /**
   * Displays a warning banner if the transaction scan fails.
   */
  if (error) {
    return (
      <Banner
        title={translate('confirmation.simulationErrorTitle')}
        severity="warning"
      >
        <Text>
          {translate('confirmation.simulationErrorSubtitle', {
            reason: getErrorMessage(error, preferences),
          })}
        </Text>
      </Banner>
    );
  }

  /**
   * Displays nothing if there is no validation.
   */
  if (!validation) {
    return <Box>{null}</Box>;
  }

  const severity = VALIDATION_TYPE_TO_SEVERITY[validation?.type];

  /**
   * Displays a banner if the validation there is a validation.
   */
  if (severity) {
    return (
      <Banner
        title={translate('confirmation.validationErrorTitle')}
        severity={severity}
      >
        <Text>{translate('confirmation.validationErrorSubtitle')}</Text>
        <Text size="sm">
          <Link href="https://support.metamask.io/configure/wallet/how-to-turn-on-security-alerts/">
            {translate('confirmation.validationErrorLearnMore')}
          </Link>
        </Text>
        <Text size="sm">
          <Icon color="primary" name="security-tick" />{' '}
          {translate('confirmation.validationErrorSecurityAdviced')}{' '}
          <Link href="https://www.blockaid.io">Blockaid</Link>
        </Text>
      </Banner>
    );
  }

  /**
   * Displays nothing by default.
   */
  return <Box>{null}</Box>;
};
