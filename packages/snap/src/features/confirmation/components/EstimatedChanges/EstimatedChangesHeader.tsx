import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Icon, Text, Tooltip, Box } from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/types/snap';
import { i18n } from '../../../../core/utils/i18n';

export const EstimatedChangesHeader: SnapComponent<{
  preferences: Preferences;
}> = ({ preferences }) => {
  const translate = i18n(preferences.locale);

  return (
    <Box direction="horizontal" center>
      <Text fontWeight="medium">
        {translate('confirmation.estimatedChanges')}
      </Text>
      <Tooltip content={translate('confirmation.estimatedChanges.tooltip')}>
        <Icon name="info" />
      </Tooltip>
    </Box>
  );
};
