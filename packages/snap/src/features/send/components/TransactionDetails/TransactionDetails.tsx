import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Address,
  Box,
  Link,
  Row,
  Section,
  Text,
  Value,
} from '@metamask/snaps-sdk/jsx';

import { Networks } from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { getSolanaExplorerUrl } from '../../../../core/utils/getSolanaExplorerUrl';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import type { SendContext } from '../../types';

export type TransactionDetailsProps = {
  context: SendContext;
};

export const TransactionDetails: SnapComponent<TransactionDetailsProps> = ({
  context,
}) => {
  const {
    scope,
    fromAccountId,
    toAddress,
    accounts,
    feeEstimatedInSol,
    preferences: { locale, currency },
    transaction,
    feePaidInSol,
    tokenPrices,
  } = context;
  const translate = i18n(locale);

  const network = Networks[scope];
  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  // FIXME: Get this out to a helper function (ie: address to CAIP-10).
  const fromAddressCaip2 =
    `${scope}:${fromAddress}` as `${string}:${string}:${string}`;
  const toAddressCaip2 =
    `${scope}:${toAddress}` as `${string}:${string}:${string}`;

  const networkName = network.name;
  const networkSymbol = network.nativeToken.symbol;
  const tokenPrice = tokenPrices[network.nativeToken.caip19Id]?.price;

  const transactionSpeed = '<1s';

  const feeToDisplay = transaction ? feePaidInSol : feeEstimatedInSol;
  const feeInUserCurrency =
    tokenPrice === undefined
      ? ''
      : formatCurrency(tokenToFiat(feeToDisplay, tokenPrice), currency);

  return (
    <Box>
      <Section>
        <Row label={translate('confirmation.from')}>
          <Link href={getSolanaExplorerUrl(scope, 'address', fromAddress)}>
            <Address address={fromAddressCaip2} displayName />
          </Link>
        </Row>

        <Row label={translate('confirmation.recipient')}>
          <Link href={getSolanaExplorerUrl(scope, 'address', toAddress)}>
            <Address address={toAddressCaip2} displayName />
          </Link>
        </Row>
      </Section>

      <Section>
        <Row label={translate('confirmation.network')}>
          <Text>{networkName}</Text>
        </Row>

        <Row label={translate('confirmation.transactionSpeed')}>
          <Text>{transactionSpeed}</Text>
        </Row>

        <Row label={translate('confirmation.fee')}>
          <Value
            extra={feeInUserCurrency}
            value={formatTokens(feeToDisplay, networkSymbol, locale)}
          />
        </Row>
      </Section>
    </Box>
  );
};
