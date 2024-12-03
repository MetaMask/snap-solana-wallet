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
import { getAddressSolanaExplorerUrl } from '../../../../core/utils/get-address-solana-explorer-url';
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
    rates,
  },
}) => {
  const fromAddress = accounts.find((account) => account.id === fromAccountId)
    ?.address as string;

  const amountInSol =
    currencySymbol === SendCurrency.SOL
      ? amount
      : BigNumber(amount)
          .dividedBy(BigNumber(rates?.conversionRate ?? '0'))
          .toString();

  const tokenPrice = rates?.conversionRate ?? 0;

  const fromAddressCaip2 =
    `${scope}:${fromAddress}` as `${string}:${string}:${string}`;
  const toAddressCaip2 =
    `${scope}:${toAddress}` as `${string}:${string}:${string}`;
  const networkName = SolanaNetworksNames[scope];
  const transactionSpeed = '12.8s';

  const amountInUserCurrency = formatCurrency(
    tokenToFiat(amountInSol.toString(), Number(tokenPrice)),
  );
  const feeInUserCurrency = formatCurrency(
    tokenToFiat(fee, Number(tokenPrice)),
  );

  const total = BigNumber(amountInSol).plus(BigNumber(fee)).toString();
  const totalInUserCurrency = formatCurrency(
    tokenToFiat(total, Number(tokenPrice)),
  );

  return (
    <Container>
      <Box>
        <Header
          title="Review"
          backButtonName={TransactionConfirmationNames.BackButton}
        />

        <Box alignment="center" center>
          <Box direction="horizontal" center>
            <Image src={SolanaLogo} />
          </Box>
          <Heading size="lg">{`Sending ${amountInSol} SOL`}</Heading>
          <Text color="muted">Review the transaction before proceeding</Text>
        </Box>

        <Section>
          <Row label="From">
            <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
              <Address address={fromAddressCaip2} />
            </Link>
          </Row>

          <Row label="Amount">
            <Value
              extra={`${amountInUserCurrency}$`}
              value={`${amountInSol} SOL`}
            />
          </Row>

          <Row label="Recipient">
            <Link href={getAddressSolanaExplorerUrl(scope, fromAddress)}>
              <Address address={toAddressCaip2} />
            </Link>
          </Row>
        </Section>

        <Section>
          <Row label="Network">
            <Text>{networkName}</Text>
          </Row>

          <Row label="Transaction speed" tooltip="Transaction speed tooltip">
            <Text>{transactionSpeed}</Text>
          </Row>

          <Row label="Network fee" tooltip="Network fee tooltip">
            <Value extra={`${feeInUserCurrency}$`} value={`${fee} SOL`} />
          </Row>

          <Row label="Total">
            <Value extra={`${totalInUserCurrency}$`} value={`${total} SOL`} />
          </Row>
        </Section>
      </Box>
      <Footer>
        <Button name={TransactionConfirmationNames.CancelButton}>Cancel</Button>
        <Button name={TransactionConfirmationNames.ConfirmButton}>Send</Button>
      </Footer>
    </Container>
  );
};
