import {
  Box,
  Container,
  Link,
  type SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { getTransactionSolanaExplorerUrl } from '../../../../core/utils/get-tx-explorer-url';
import { i18n } from '../../../../core/utils/i18n';
import { type TransactionResultDialogContext } from './types';

type TransactionResultDialogProps = {
  context: TransactionResultDialogContext;
};

export const TransactionResultDialog: SnapComponent<
  TransactionResultDialogProps
> = ({ context: { scope, transactionSuccess, signature, locale } }) => {
  const translate = i18n(locale);

  return (
    <Container>
      <Box alignment="center" center>
        {transactionSuccess && signature ? (
          <Box alignment="center" center>
            <Text>{translate('transactionResultDialog.submitted')}</Text>
            <Link href={getTransactionSolanaExplorerUrl(scope, signature)}>
              {translate('transactionResultDialog.viewTransaction')}
            </Link>
          </Box>
        ) : (
          <Box>
            <Text color="error">
              {translate('transactionResultDialog.error')}
            </Text>
          </Box>
        )}
      </Box>
    </Container>
  );
};
