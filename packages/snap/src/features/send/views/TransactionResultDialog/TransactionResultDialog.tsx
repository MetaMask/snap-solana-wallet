import {
  Box,
  Container,
  Image,
  Link,
  type SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';

type TransactionResultDialogProps = {
  signature: string;
};

export const TransactionResultDialog: SnapComponent<
  TransactionResultDialogProps
> = ({ signature }) => {
  const explorerUrl = `https://explorer.solana.com/tx/${signature}`;

  return (
    <Container>
      <Box alignment="center" center>
        <Box direction="horizontal" center>
          <Text>SVG</Text>
        </Box>
        <Text color="muted">Your transaction was submitted</Text>
        <Link href={explorerUrl}>View transaction</Link>
      </Box>
    </Container>
  );
};
