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
import type { FetchStatus, Preferences } from '../../../../core/types/snap';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCrypto } from '../../../../core/utils/formatCrypto';
import { formatFiat } from '../../../../core/utils/formatFiat';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';

type TransactionDetailsProps = {
  accountAddress: string | null;
  scope: Network;
  feeInSol: string | null;
  nativePrice: number | null;
  fetchingPricesStatus: FetchStatus;
  preferences: Preferences;
  networkImage: string | null;
  origin: string;
};

export const TransactionDetails: SnapComponent<TransactionDetailsProps> = ({
  origin,
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
  const originHostname = origin ? new URL(origin).hostname : null;

  const pricesFetching = fetchingPricesStatus === 'fetching';
  const pricesError = fetchingPricesStatus === 'error';

  const feeInFiat =
    feeInSol && nativePrice && !pricesError
      ? formatFiat(tokenToFiat(feeInSol, nativePrice), currency, locale)
      : '';

  return (
    <Section>
      {originHostname ? (
        <Box>
          <Box alignment="space-between" direction="horizontal">
            <Box alignment="space-between" direction="horizontal" center>
              <Text fontWeight="medium" color="alternative">
                {translate('confirmation.origin')}
              </Text>
              <Tooltip content={translate('confirmation.origin.tooltip')}>
                <Icon name="question" color="muted" />
              </Tooltip>
            </Box>
            <Text>{originHostname}</Text>
          </Box>
          <Box>{null}</Box>
        </Box>
      ) : null}
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
