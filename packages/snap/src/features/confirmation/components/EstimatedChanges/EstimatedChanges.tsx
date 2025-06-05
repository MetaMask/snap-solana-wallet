import {
  Box,
  Section,
  Text,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/domain';
import type {
  TransactionScanEstimatedChanges,
  TransactionScanStatus,
} from '../../../../core/services/transaction-scan/types';
import { i18n } from '../../../../core/utils/i18n';
import type { FetchStatus } from '../../../../types';
import { AssetChange } from '../AssetChange/AssetChange';
import { EstimatedChangesHeader } from './EstimatedChangesHeader';
import { EstimatedChangesSkeleton } from './EstimatedChangesSkeleton';

type EstimatedChangesProps = {
  changes: TransactionScanEstimatedChanges | null;
  scanStatus: TransactionScanStatus | null;
  preferences: Preferences;
  scanFetchStatus: FetchStatus;
};

export const EstimatedChanges: SnapComponent<EstimatedChangesProps> = ({
  changes,
  preferences,
  scanFetchStatus,
  scanStatus,
}) => {
  const translate = i18n(preferences.locale);

  const isFetching = scanFetchStatus === 'fetching';
  const isFetched = scanFetchStatus === 'fetched';
  const isError = scanFetchStatus === 'error';

  if (isFetching) {
    return <EstimatedChangesSkeleton preferences={preferences} />;
  }

  if (isError || (isFetched && scanStatus === 'ERROR')) {
    return (
      <Section direction="vertical">
        <EstimatedChangesHeader preferences={preferences} />
        <Text color="alternative">
          {translate('confirmation.estimatedChanges.notAvailable')}
        </Text>
      </Section>
    );
  }

  const send = changes?.assets.filter((asset) => asset.type === 'out') ?? [];
  const receive = changes?.assets.filter((asset) => asset.type === 'in') ?? [];

  const hasChanges = send.length > 0 || receive.length > 0;

  if (isFetched && !hasChanges) {
    return (
      <Section direction="vertical">
        <EstimatedChangesHeader preferences={preferences} />
        <Text color="alternative">
          {translate('confirmation.estimatedChanges.noChanges')}
        </Text>
      </Section>
    );
  }

  return (
    <Section>
      <EstimatedChangesHeader preferences={preferences} />
      {send?.length > 0 ? (
        <Box alignment="space-between" direction="horizontal">
          <Text fontWeight="medium" color="alternative">
            {translate('confirmation.estimatedChanges.send')}
          </Text>
          <Box>
            <Box>
              {send?.map((asset) => (
                <AssetChange asset={asset} preferences={preferences} />
              ))}
            </Box>
          </Box>
        </Box>
      ) : null}
      <Box>{null}</Box>
      {receive?.length > 0 ? (
        <Box alignment="space-between" direction="horizontal">
          <Text fontWeight="medium" color="alternative">
            {translate('confirmation.estimatedChanges.receive')}
          </Text>
          <Box>
            <Box>
              {receive?.map((asset) => (
                <AssetChange asset={asset} preferences={preferences} />
              ))}
            </Box>
          </Box>
        </Box>
      ) : null}
    </Section>
  );
};
