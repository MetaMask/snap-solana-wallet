import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Image, Text } from '@metamask/snaps-sdk/jsx';

import type { Preferences } from '../../../../core/domain';
import type { TransactionScanAssetChange } from '../../../../core/services/transaction-scan/types';
import { formatCryptoBalance } from '../../../../core/utils/formatCryptoBalance';
import { formatFiat } from '../../../../core/utils/formatFiat';

export const AssetChange: SnapComponent<{
  asset: TransactionScanAssetChange;
  preferences: Preferences;
}> = ({ asset, preferences }) => {
  const changeType = asset.type;

  return (
    <Box direction="vertical" crossAlignment="end">
      <Box direction="horizontal" alignment="center">
        <Text color={changeType === 'in' ? 'success' : 'error'}>
          {changeType === 'in' ? '+' : '-'}
          {formatCryptoBalance(asset.value ?? 0, preferences.locale)}
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
          {formatFiat(
            asset.price.toString(),
            preferences.currency,
            preferences.locale,
          )}
        </Text>
      ) : null}
    </Box>
  );
};
