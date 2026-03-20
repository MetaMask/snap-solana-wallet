import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Section, Skeleton } from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/types/snap';
import { EstimatedChangesHeader } from './EstimatedChangesHeader';

export const EstimatedChangesSkeleton: SnapComponent<{
  preferences: Preferences;
}> = ({ preferences }) => {
  return (
    <Section direction="vertical">
      <EstimatedChangesHeader preferences={preferences} />
      <Box alignment="space-between" direction="horizontal">
        <Skeleton width={60} height={20} />
        <Box>
          <Box direction="vertical" crossAlignment="end">
            <Skeleton width={100} height={20} />
            <Skeleton width={40} height={20} />
          </Box>
        </Box>
      </Box>
    </Section>
  );
};
