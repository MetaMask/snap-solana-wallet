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

import SolanaLogo from '../../../../../images/coin.svg';
import { Header } from '../../../../core/components/Header/Header';
import { SolanaNetworksNames } from '../../../../core/constants/solana';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { getAddressSolanaExplorerUrl } from '../../../../core/utils/get-address-solana-explorer-url';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { SendCurrency } from '../SendForm/types';
import { type ConfirmationDialogContext } from './types';

export enum TransactionConfirmationNames {
  BackButton = 'transaction-confirmation-back-button',
  CancelButton = 'transaction-confirmation-cancel-button',
  ConfirmButton = 'transaction-confirmation-submit-button',
}

type TransactionConfirmationProps = {
  context: ConfirmationDialogContext;
};

export const TransactionConfirmation: SnapComponent<
  TransactionConfirmationProps
> = ({
  context: {
    scope,
    fromAccountId,
    amount,
    toAddress,
    accounts,
    fee,
    currencySymbol,
    tokenRate,
    locale,
  },
}) => {
  const transalte = i18n(locale);

  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  const { conversionRate } = tokenRate;

  const amountInSol =
    currencySymbol === SendCurrency.SOL
      ? amount
      : BigNumber(amount).dividedBy(BigNumber(conversionRate)).toString();

  // FIXME: Get this out to a helper function (ie: address to CAIP-10).
  const fromAddressCaip2 =
    `${scope}:${fromAddress}` as `${string}:${string}:${string}`;
  const toAddressCaip2 =
    `${scope}:${toAddress}` as `${string}:${string}:${string}`;
  const networkName = SolanaNetworksNames[scope];
  // TODO: Get the transaction speed from the network.
  const transactionSpeed = '12.8s';

  const amountInUserCurrency = formatCurrency(
    tokenToFiat(amountInSol.toString(), Number(conversionRate)),
  );
  const feeInUserCurrency = formatCurrency(
    tokenToFiat(fee, Number(conversionRate)),
  );

  const total = BigNumber(amountInSol).plus(BigNumber(fee)).toString();
  const totalInUserCurrency = formatCurrency(
    tokenToFiat(total, Number(conversionRate)),
  );

  return (
    <Container>
      <Box>
        <Header
          title={transalte('confirmation.title')}
          backButtonName={TransactionConfirmationNames.BackButton}
        />

        <Box alignment="center" center>
          <Box direction="horizontal" center>
            <Image src={SolanaLogo} />
          </Box>
          <Heading size="lg">
            {transalte('confirmation.heading', {
              amount: amountInSol,
              tokenSymbol: currencySymbol,
            })}
          </Heading>
          <Text color="muted">{transalte('confirmation.subheading')}</Text>
        </Box>

        <Section>
          <Row label={transalte('confirmation.from')}>
            <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
              <Address address={fromAddressCaip2} />
            </Link>
          </Row>

          <Row label={transalte('confirmation.amount')}>
            <Value
              extra={amountInUserCurrency}
              value={formatTokens(amountInSol, currencySymbol)}
            />
          </Row>

          <Row label={transalte('confirmation.recipient')}>
            <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
              <Address address={toAddressCaip2} />
            </Link>
          </Row>
        </Section>

        <Section>
          <Row label={transalte('confirmation.network')}>
            <Text>{networkName}</Text>
          </Row>

          <Row
            label={transalte('confirmation.transactionSpeed')}
            tooltip={transalte('confirmation.transactionSpeedTooltip')}
          >
            <Text>{transactionSpeed}</Text>
          </Row>

          <Row
            label={transalte('confirmation.fee')}
            tooltip={transalte('confirmation.feeTooltip')}
          >
            <Value
              extra={feeInUserCurrency}
              value={formatTokens(fee, currencySymbol)}
            />
          </Row>

          <Row label={transalte('confirmation.total')}>
            <Value
              extra={totalInUserCurrency}
              value={formatTokens(total, currencySymbol)}
            />
          </Row>
        </Section>
      </Box>
      <Footer>
        <Button name={TransactionConfirmationNames.CancelButton}>
          {transalte('confirmation.cancelButton')}
        </Button>
        <Button name={TransactionConfirmationNames.ConfirmButton}>
          {transalte('confirmation.sendButton')}
        </Button>
      </Footer>
    </Container>
  );
};
