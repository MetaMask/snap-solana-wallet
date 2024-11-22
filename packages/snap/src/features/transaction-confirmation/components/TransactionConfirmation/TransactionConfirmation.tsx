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
  type SnapComponent,
  Text,
  Value,
} from '@metamask/snaps-sdk/jsx';

import SolanaLogo from '../../../../../images/icon.svg';
import { Header } from '../../../../core/components/Header/Header';
import { SolanaNetworksNames } from '../../../../core/constants/solana';
import { getAddressSolanaExplorerUrl } from '../../../../core/utils/get-address-solana-explorer-url';
import {
  type TransactionConfirmationContext,
  TransactionConfirmationNames,
} from './types';

type TransactionConfirmationProps = {
  context: TransactionConfirmationContext;
};

export const TransactionConfirmation: SnapComponent<
  TransactionConfirmationProps
> = ({
  context: {
    scope,
    fromAddress,
    toAddress,
    amount,
    fee,
    tokenSymbol,
    tokenPrice,
  },
}) => {
  const fromAddressCaip2 =
    `${scope}:${fromAddress}` as `${string}:${string}:${string}`;
  const toAddressCaip2 =
    `${scope}:${toAddress}` as `${string}:${string}:${string}`;
  const networkName = SolanaNetworksNames[scope];
  const transactionSpeed = '12.8s';

  const amountInUserCurrency = (Number(amount) * tokenPrice).toFixed(2);
  const feeInUserCurrency = (Number(fee) * tokenPrice).toFixed(2);
  const total = Number(amount) + Number(fee);
  const totalInUserCurrency = (
    Number(amount) * tokenPrice +
    Number(fee)
  ).toFixed(2);

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
          <Heading size="lg">{`Sending ${amount} ${tokenSymbol}`}</Heading>
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
              value={`${amount} ${tokenSymbol}`}
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
        <Button name={TransactionConfirmationNames.Cancel}>Cancel</Button>
        <Button name={TransactionConfirmationNames.Confirm}>Send</Button>
      </Footer>
    </Container>
  );
};
