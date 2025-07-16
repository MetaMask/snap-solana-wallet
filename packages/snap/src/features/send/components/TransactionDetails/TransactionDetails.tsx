import {
  Address,
  Box,
  Link,
  Row,
  Section,
  Text,
  Value,
} from '@metamask/snaps-sdk/jsx';

import { Domain } from '../../../../core/components/Domain/Domain';
import { Networks } from '../../../../core/constants/solana';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCrypto } from '../../../../core/utils/formatCrypto';
import { formatFiat } from '../../../../core/utils/formatFiat';
import { getSolanaExplorerUrl } from '../../../../core/utils/getSolanaExplorerUrl';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import type { SendContext } from '../../types';

export type TransactionDetailsProps = {
  context: SendContext;
};

export const TransactionDetails = ({ context }: TransactionDetailsProps) => {
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
    fromDomain,
    toDomain,
  } = context;
  const translate = i18n(locale);

  const network = Networks[scope];
  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  const fromAddressCaip2 = addressToCaip10(scope, fromAddress);

  const networkName = network.name;
  const networkSymbol = network.nativeToken.symbol;
  const tokenPrice = tokenPrices[network.nativeToken.caip19Id]?.price;

  const transactionSpeed = '<1s';

  const fee = transaction ? feePaidInSol : feeEstimatedInSol;
  const feeToDisplay = fee ? formatCrypto(fee, networkSymbol, locale) : '';
  const feeInUserCurrency =
    tokenPrice === undefined || fee === null
      ? ''
      : formatFiat(tokenToFiat(fee, tokenPrice), currency, locale);

  return (
    <Box>
      <Section>
        <Row label={translate('send.confirmation.from')}>
          {fromDomain ? (
            <Domain domain={fromDomain} scope={scope} address={fromAddress} />
          ) : (
            <Link href={getSolanaExplorerUrl(scope, 'address', fromAddress)}>
              <Address address={fromAddressCaip2} displayName />
            </Link>
          )}
        </Row>

        {toAddress ? (
          <Row label={translate('send.confirmation.recipient')}>
            {toDomain ? (
              <Domain domain={toDomain} scope={scope} address={toAddress} />
            ) : (
              <Link href={getSolanaExplorerUrl(scope, 'address', toAddress)}>
                <Address
                  address={addressToCaip10(scope, toAddress)}
                  displayName
                />
              </Link>
            )}
          </Row>
        ) : null}
      </Section>

      <Section>
        <Row label={translate('send.confirmation.network')}>
          <Text>{networkName}</Text>
        </Row>

        <Row label={translate('send.confirmation.transactionSpeed')}>
          <Text>{transactionSpeed}</Text>
        </Row>

        <Row label={translate('send.confirmation.fee')}>
          <Value extra={feeInUserCurrency} value={feeToDisplay} />
        </Row>
      </Section>
    </Box>
  );
};
