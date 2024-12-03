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
import BigNumber from 'bignumber.js';

import {
  SolanaCaip19Tokens,
  SolanaNetworksNames,
} from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { getSolanaExplorerUrl } from '../../../../core/utils/get-solana-explorer-url';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import type { SendContext } from '../../types';
import { SendCurrency } from '../../types';

export type TransactionDetailsProps = {
  context: SendContext;
};

export const TransactionDetails: SnapComponent<TransactionDetailsProps> = ({
  context: {
    scope,
    fromAccountId,
    amount,
    toAddress,
    accounts,
    fee,
    currencySymbol,
    tokenPrices,
    preferences: { locale, currency },
    transaction,
  },
}) => {
  const translate = i18n(locale);

  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  // TODO: Adapt for more types of token prices to support SPL tokens.
  const { price } =
    transaction?.tokenPrice ?? tokenPrices[SolanaCaip19Tokens.SOL];

  const amountInSol =
    currencySymbol === SendCurrency.SOL
      ? amount
      : BigNumber(amount).dividedBy(BigNumber(price)).toString();

  // FIXME: Get this out to a helper function (ie: address to CAIP-10).
  const fromAddressCaip2 =
    `${scope}:${fromAddress}` as `${string}:${string}:${string}`;
  const toAddressCaip2 =
    `${scope}:${toAddress}` as `${string}:${string}:${string}`;
  const networkName = SolanaNetworksNames[scope];

  const transactionSpeed = '<1s';

  const amountInUserCurrency = formatCurrency(
    tokenToFiat(amountInSol.toString(), price),
    currency,
  );
  const feeInUserCurrency = formatCurrency(tokenToFiat(fee, price), currency);

  const total = BigNumber(amountInSol).plus(BigNumber(fee)).toString();
  const totalInUserCurrency = formatCurrency(
    tokenToFiat(total, price),
    currency,
  );

  return (
    <Box>
      <Section>
        <Row label={translate('confirmation.from')}>
          <Link href={getSolanaExplorerUrl(scope, 'address', fromAddress)}>
            <Address address={fromAddressCaip2} displayName />
          </Link>
        </Row>

        <Row label={translate('confirmation.amount')}>
          <Value
            extra={amountInUserCurrency}
            value={formatTokens(amountInSol, currencySymbol)}
          />
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
            value={formatTokens(fee, currencySymbol)}
          />
        </Row>

        <Row label={translate('confirmation.total')}>
          <Value
            extra={totalInUserCurrency}
            value={formatTokens(total, currencySymbol)}
          />
        </Row>
      </Section>
    </Box>
  );
};
