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

import type { Network, Preferences } from '../../../../core/domain';
import { Networks } from '../../../../core/domain';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCrypto } from '../../../../core/utils/formatCrypto';
import { formatFiat } from '../../../../core/utils/formatFiat';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import type { FetchStatus } from '../../../../types';

type TransactionDetailsProps = {
  accountAddress: string | null;
  scope: Network;
  feeInSol: string | null;
  nativePrice: number | null;
  fetchingPricesStatus: FetchStatus;
  preferences: Preferences;
  networkImage: string | null;
};

export const TransactionDetails: SnapComponent<TransactionDetailsProps> = ({
  accountAddress,
  scope,
  feeInSol,
  nativePrice,
  fetchingPricesStatus,
  preferences,
  networkImage,
}) => {
  const { currency, locale } = preferences;
  const translate = i18n(locale);

  const pricesFetching = fetchingPricesStatus === 'fetching';
  const pricesError = fetchingPricesStatus === 'error';

  const feeInFiat =
    feeInSol && nativePrice && !pricesError
      ? formatFiat(tokenToFiat(feeInSol, nativePrice), currency, locale)
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
      <Box>{null}</Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.network')}
        </Text>
        <Box direction="horizontal" alignment="center">
          <Box alignment="center" center>
            <Image borderRadius="medium" src={networkImage ?? ''} />
          </Box>
          <Text>{Networks[scope].name}</Text>
        </Box>
      </Box>
      <Box>{null}</Box>
      <Box alignment="space-between" direction="horizontal">
        <Text fontWeight="medium" color="alternative">
          {translate('confirmation.fee')}
        </Text>
        {feeInSol ? (
          <Box direction="horizontal" alignment="center">
            {pricesFetching ? (
              <Skeleton width={80} />
            ) : (
              <Text color="muted">{feeInFiat}</Text>
            )}
            <Text>
              {formatCrypto(
                feeInSol,
                Networks[scope].nativeToken.symbol,
                locale,
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
