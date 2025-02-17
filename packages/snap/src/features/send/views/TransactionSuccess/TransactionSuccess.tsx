import { Box, Container, Link } from '@metamask/snaps-sdk/jsx';

import CheckIcon from '../../../../../images/check.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { formatTokens } from '../../../../core/utils/formatTokens';
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
          title={translate('send.transaction-success.title')}
          subtitle={translate('send.transaction-success.subtitle', {
            amount: formatTokens(tokenAmount, tokenSymbol, preferences.locale),
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
              {translate('send.confirmation.viewTransaction')}
            </Link>
          </Box>
        ) : null}
      </Box>
    </Container>
  );
};
