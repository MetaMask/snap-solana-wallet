import {
  Box,
  Section,
  Skeleton,
  Text,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { TransactionScanEstimatedChanges } from '../../../../core/services/transaction-scan/types';
import type { FetchStatus } from '../../../../core/types/snap';
import { formatCryptoBalance } from '../../../../core/utils/formatCryptoBalance';
import { i18n, type Locale } from '../../../../core/utils/i18n';

type EstimatedChangesProps = {
  changes: TransactionScanEstimatedChanges | null;
  locale: Locale;
  scanFetchStatus: FetchStatus;
};

export const EstimatedChanges: SnapComponent<EstimatedChangesProps> = ({
  changes,
  locale,
  scanFetchStatus,
}) => {
  const translate = i18n(locale);

  const isFetching = scanFetchStatus !== 'fetched';
  const isError = scanFetchStatus === 'error';

  if (isError) {
    return <Box>{null}</Box>;
  }

  const send = changes?.assets.filter((asset) => asset.type === 'in') ?? [];
  const receive = changes?.assets.filter((asset) => asset.type === 'out') ?? [];

  return (
    <Section>
      <Text>{translate('confirmation.estimatedChanges')}</Text>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.estimatedChanges.send')}
        </Text>
        <Box>
          {isFetching ? (
            <Box direction="vertical" alignment="start">
              <Skeleton width={100} height={20} />
              <Skeleton width={40} height={20} />
            </Box>
          ) : (
            <Box>
              {send?.map((asset) => (
                <Box direction="vertical" alignment="start">
                  <Box direction="horizontal">
                    <Text>{formatCryptoBalance(asset.value ?? 0, locale)}</Text>
                    <Text>{asset.symbol ?? ''}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Box>{null}</Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.estimatedChanges.receive')}
        </Text>
        <Box>
          {isFetching ? (
            <Box direction="vertical" alignment="start">
              <Skeleton width={100} height={20} />
              <Skeleton width={40} height={20} />
            </Box>
          ) : (
            <Box>
              {receive?.map((asset) => (
                <Box direction="vertical" alignment="start">
                  <Text>{formatCryptoBalance(asset.value ?? 0, locale)}</Text>
                  <Text>{asset.symbol ?? ''}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Section>
  );
};
