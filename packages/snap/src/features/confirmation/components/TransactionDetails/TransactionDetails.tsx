import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Address,
  Box,
  Icon,
  Image,
  Section,
  Skeleton,
  Text,
  Tooltip,
} from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../../../core/constants/solana';
import { Networks } from '../../../../core/constants/solana';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import type { FetchStatus, Preferences } from '../../../../core/types/snap';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';

type TransactionDetailsProps = {
  accountAddress: string | null;
  scope: Network;
  feeInSol: string | null;
  nativePrice: number;
  fetchingPricesStatus: FetchStatus;
  preferences: Preferences;
};

export const TransactionDetails: SnapComponent<TransactionDetailsProps> = ({
  accountAddress,
  scope,
  feeInSol,
  nativePrice,
  fetchingPricesStatus,
  preferences,
}) => {
  const translate = i18n(preferences.locale);

  const pricesFetching = fetchingPricesStatus === 'fetching';
  const pricesError = fetchingPricesStatus === 'error';

  const feeInFiat =
    feeInSol && nativePrice && !pricesError
      ? formatCurrency(tokenToFiat(feeInSol, nativePrice), preferences.currency)
      : '';

  return (
    <Section>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.account')}
        </Text>
        <Address
          address={addressToCaip10(scope, accountAddress as string)}
          truncate
          displayName
          avatar
        />
      </Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.network')}
        </Text>
        <Box direction="horizontal" alignment="center">
          <Image borderRadius="medium" src={SOL_IMAGE_SVG} />
          <Text>{Networks[scope].name}</Text>
        </Box>
      </Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.fee')}
        </Text>
        {feeInSol ? (
          <Box direction="horizontal" alignment="center">
            {pricesFetching ? <Skeleton /> : <Text>{feeInFiat}</Text>}
            <Text>
              {formatTokens(
                feeInSol,
                Networks[scope].nativeToken.symbol,
                preferences.locale,
              )}
            </Text>
          </Box>
        ) : (
          <Tooltip content={translate('confirmation.feeError')}>
            <Icon name="warning" />
          </Tooltip>
        )}
      </Box>
    </Section>
  );
};

export default TransactionDetails;
