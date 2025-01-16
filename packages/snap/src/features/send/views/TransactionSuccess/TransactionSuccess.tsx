import { Box, Container, Link } from '@metamask/snaps-sdk/jsx';

import CheckIcon from '../../../../../images/check.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { getSolanaExplorerUrl } from '../../../../core/utils/getSolanaExplorerUrl';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { getSelectedTokenMetadata, getTokenAmount } from '../../selectors';
import type { SendContext } from '../../types';

export type TransactionSuccessProps = {
  context: SendContext;
};

export const TransactionSuccess = ({ context }: TransactionSuccessProps) => {
  const { preferences, transaction, scope } = context;

  const translate = i18n(preferences.locale);

  const { tokenSymbol } = getSelectedTokenMetadata(context);
  const tokenAmount = getTokenAmount(context);

  return (
    <Container>
      <Box>
        <Box>{null}</Box>
        <ActionHeader
          title={translate('transaction-success.title')}
          subtitle={translate('transaction-success.subtitle', {
            amount: tokenAmount,
            tokenSymbol,
          })}
          iconSrc={CheckIcon}
        />
        <TransactionDetails context={context} />
        {transaction?.signature ? (
          <Box alignment="center" center>
            <Link
              href={getSolanaExplorerUrl(scope, 'tx', transaction?.signature)}
            >
              {translate('confirmation.viewTransaction')}
            </Link>
          </Box>
        ) : null}
      </Box>
    </Container>
  );
};
