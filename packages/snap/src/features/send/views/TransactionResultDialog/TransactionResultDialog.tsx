import {
  Box,
  Container,
  Link,
  type SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';

type TransactionResultDialogProps = {
  transactionSuccess: boolean;
  signature: string | null;
};

export const TransactionResultDialog: SnapComponent<
  TransactionResultDialogProps
> = ({ transactionSuccess, signature }) => {
  const explorerUrl = `https://explorer.solana.com/tx/${signature}`;

  return (
    <Container>
      <Box alignment="center" center>
        <Box direction="horizontal" center>
          <Text>SVG</Text>
        </Box>
        {transactionSuccess ? (
          <Box>
            <Text color="muted">Your transaction was submitted</Text>
            <Link href={explorerUrl}>View transaction</Link>
          </Box>
        ) : (
          <Box>
            <Text color="error">
              An error occurred while submitting your transaction, please try
              again later
            </Text>
          </Box>
        )}
      </Box>
    </Container>
  );
};
