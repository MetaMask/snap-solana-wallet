import {
  Address,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Image,
  Link,
  Row,
  Section,
  Text,
  Value,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';
import BigNumber from 'bignumber.js';

import CheckIcon from '../../../../../images/check.svg';
import SolanaLogo from '../../../../../images/coin.svg';
import ErrorIcon from '../../../../../images/error.svg';
import { Header } from '../../../../core/components/Header/Header';
import {
  SolanaCaip19Tokens,
  SolanaNetworksNames,
} from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { getAddressSolanaExplorerUrl } from '../../../../core/utils/get-address-solana-explorer-url';
import { getTransactionSolanaExplorerUrl } from '../../../../core/utils/get-tx-explorer-url';
import type { LocalizedMessage } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import type { SendTransation } from '../SendForm/types';
import { SendCurrency } from '../SendForm/types';
import { type TransactionConfirmationContext } from './types';

export enum TransactionConfirmationNames {
  BackButton = 'transaction-confirmation-back-button',
  CancelButton = 'transaction-confirmation-cancel-button',
  ConfirmButton = 'transaction-confirmation-submit-button',
}

type TransactionConfirmationProps = {
  context: TransactionConfirmationContext;
};

const TransactionDetails: SnapComponent<TransactionConfirmationProps> = ({
  context: {
    scope,
    fromAccountId,
    amount,
    toAddress,
    accounts,
    fee,
    currencySymbol,
    tokenPrices,
    locale,
    transaction,
  },
}) => {
  const translate = i18n(locale);

  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  const { price } = tokenPrices[SolanaCaip19Tokens.SOL];

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
  // TODO: Get the transaction speed from the network.
  const transactionSpeed = '12.8s';

  const amountInUserCurrency = formatCurrency(
    tokenToFiat(amountInSol.toString(), Number(price)),
  );
  const feeInUserCurrency = formatCurrency(tokenToFiat(fee, Number(price)));

  const total = BigNumber(amountInSol).plus(BigNumber(fee)).toString();
  const totalInUserCurrency = formatCurrency(tokenToFiat(total, Number(price)));

  const transactionResultToIcon: Record<SendTransation['result'], string> = {
    success: CheckIcon,
    failure: ErrorIcon,
  };

  const transactionResultToHeading: Record<
    SendTransation['result'],
    LocalizedMessage
  > = {
    success: 'confirmation.sent',
    failure: 'confirmation.failed',
  };

  const transactionResultToSubHeading: Record<
    SendTransation['result'],
    LocalizedMessage
  > = {
    success: 'confirmation.sentSubheading',
    failure: 'confirmation.failedSubheading',
  };

  return (
    <Box>
      {transaction ? null : (
        <Header
          title={translate('confirmation.title')}
          backButtonName={TransactionConfirmationNames.BackButton}
        />
      )}
      <Box alignment="center" center>
        <Box direction="horizontal" center>
          <Image
            src={
              transaction
                ? transactionResultToIcon[transaction.result]
                : SolanaLogo
            }
          />
        </Box>
        <Heading size="lg">
          {transaction
            ? translate(transactionResultToHeading[transaction.result])
            : translate('confirmation.heading', {
                amount: amountInSol,
                tokenSymbol: currencySymbol,
              })}
        </Heading>
        <Text color="muted">
          {transaction
            ? translate(transactionResultToSubHeading[transaction.result], {
                amount: amountInSol,
                tokenSymbol: currencySymbol,
              })
            : translate('confirmation.subheading')}
        </Text>
      </Box>

      <Section>
        <Row label={translate('confirmation.from')}>
          <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
            <Address address={fromAddressCaip2} />
          </Link>
        </Row>

        <Row label={translate('confirmation.amount')}>
          <Value
            extra={amountInUserCurrency}
            value={formatTokens(amountInSol, currencySymbol)}
          />
        </Row>

        <Row label={translate('confirmation.recipient')}>
          <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
            <Address address={toAddressCaip2} />
          </Link>
        </Row>
      </Section>

      <Section>
        <Row label={translate('confirmation.network')}>
          <Text>{networkName}</Text>
        </Row>

        <Row
          label={translate('confirmation.transactionSpeed')}
          tooltip={translate('confirmation.transactionSpeedTooltip')}
        >
          <Text>{transactionSpeed}</Text>
        </Row>

        <Row
          label={translate('confirmation.fee')}
          tooltip={translate('confirmation.feeTooltip')}
        >
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

      {transaction?.signature ? (
        <Box alignment="center" center>
          <Link
            href={getTransactionSolanaExplorerUrl(
              scope,
              transaction?.signature,
            )}
          >
            {translate('confirmation.viewTransaction')}
          </Link>
        </Box>
      ) : null}
    </Box>
  );
};

export const TransactionConfirmation: SnapComponent<
  TransactionConfirmationProps
> = ({ context }) => {
  const translate = i18n(context.locale);

  if (context.transaction) {
    return (
      <Container>
        <TransactionDetails context={context} />
      </Container>
    );
  }

  return (
    <Container>
      <TransactionDetails context={context} />
      <Footer>
        <Button name={TransactionConfirmationNames.CancelButton}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button name={TransactionConfirmationNames.ConfirmButton}>
          {translate('confirmation.sendButton')}
        </Button>
      </Footer>
    </Container>
  );
};
