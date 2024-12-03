import {
  Box,
  Container,
  Link,
  type SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { getTransactionSolanaExplorerUrl } from '../../../../core/utils/get-tx-explorer-url';
import { type TransactionResultDialogContext } from './types';

type TransactionResultDialogProps = {
  context: TransactionResultDialogContext;
};

export const TransactionResultDialog: SnapComponent<
  TransactionResultDialogProps
> = ({ context: { scope, transactionSuccess, signature } }) => {
  return (
    <Container>
      <Box alignment="center" center>
        {transactionSuccess && signature ? (
          <Box alignment="center" center>
            <Text>Your transaction was submitted</Text>
            <Link href={getTransactionSolanaExplorerUrl(scope, signature)}>
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
