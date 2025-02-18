import { Box, Image, Text } from '@metamask/snaps-sdk/jsx';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import type { TransactionScanAssetChange } from '../../../../core/services/transaction-scan/types';
import type { Preferences } from '../../../../core/types/snap';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';

export const AssetChange: SnapComponent<{
  asset: TransactionScanAssetChange;
  preferences: Preferences;
}> = ({ asset, preferences }) => {
  const changeType = asset.type;

  return (
    <Box direction="vertical">
      <Box direction="horizontal" alignment="start">
        <Text color={changeType === 'in' ? 'success' : 'error'}>
          {changeType === 'in' ? '+' : '-'}
          {formatTokens(asset.value ?? 0, '', preferences.locale)}
        </Text>
        {asset.imageSvg ? (
          <Box alignment="center" center>
            <Image borderRadius="full" src={asset.imageSvg} />
          </Box>
        ) : null}
        <Text>{asset.symbol ?? ''}</Text>
      </Box>
      {asset.price ? (
        <Text color="muted">
          {formatCurrency(asset.price.toString(), preferences.currency)}
        </Text>
      ) : null}
    </Box>
  );
};
