import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Section, Skeleton, Text } from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/types/snap';
import { i18n } from '../../../../core/utils/i18n';
import { EstimatedChangesHeader } from './EstimatedChangesHeader';

export const EstimatedChangesSkeleton: SnapComponent<{
  preferences: Preferences;
}> = ({ preferences }) => {
  const translate = i18n(preferences.locale);

  return (
    <Section direction="vertical">
      <EstimatedChangesHeader preferences={preferences} />
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.estimatedChanges.send')}
        </Text>
        <Box>
          <Box direction="vertical" alignment="start">
            <Skeleton width={100} height={20} />
            <Skeleton width={40} height={20} />
          </Box>
        </Box>
      </Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.estimatedChanges.receive')}
        </Text>
        <Box>
          <Box direction="vertical" alignment="start">
            <Skeleton width={100} height={20} />
            <Skeleton width={40} height={20} />
          </Box>
        </Box>
      </Box>
    </Section>
  );
};
