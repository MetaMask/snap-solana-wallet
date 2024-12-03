import {
  Box,
  Container,
  Link,
  type SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { SolanaCaip2Networks } from '../../../../core/constants/solana';
import { type TransactionResultDialogContext } from './types';

type TransactionResultDialogProps = {
  context: TransactionResultDialogContext;
};

export const TransactionResultDialog: SnapComponent<
  TransactionResultDialogProps
> = ({ context: { scope, transactionSuccess, signature }  }) => {
    
  const getTransactionSolanaExplorerUrl = (
    scope: SolanaCaip2Networks,
    signature: string | null,
  ) => {
    switch (scope) {
      case SolanaCaip2Networks.Devnet:
        return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      case SolanaCaip2Networks.Testnet:
        return `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
      default:
        return `https://explorer.solana.com/tx/${signature}`;
    }
  };

  return (
    <Container>
      <Box alignment="center" center>
        {transactionSuccess ? (
          <Box alignment="center" center>
            <Text>Your transaction was submitted</Text>
            <Link href={getTransactionSolanaExplorerUrl(scope, signature!)}>
              View transaction
            </Link>
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
