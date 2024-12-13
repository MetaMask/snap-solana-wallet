import { Box, Container, Link } from '@metamask/snaps-sdk/jsx';

import CheckIcon from '../../../../../images/check.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { getTransactionSolanaExplorerUrl } from '../../../../core/utils/get-tx-explorer-url';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { getAmountInSol } from '../../selectors';
import type { SendContext } from '../../types';

export type TransactionSuccessProps = {
  context: SendContext;
};

export const TransactionSuccess = ({ context }: TransactionSuccessProps) => {
  const { currencySymbol, locale, scope, transaction } = context;
  const translate = i18n(locale);
  const amountInSol = getAmountInSol(context);

  return (
    <Container>
      <Box>
        <Box>{null}</Box>
        <ActionHeader
          title={translate('transaction-success.title')}
          subtitle={translate('transaction-success.subtitle', {
            amount: amountInSol,
            tokenSymbol: currencySymbol,
          })}
          iconSrc={CheckIcon}
        />
        <TransactionDetails context={context} />
        {transaction?.signature ? (
          <Box alignment="center" center>
            <Link
              href={getTransactionSolanaExplorerUrl(
                scope,
                transaction?.signature,
              )}
            >
              {translate('confirmation.viewTransaction')}
            </Link>
          </Box>
        ) : null}
      </Box>
    </Container>
  );
};
