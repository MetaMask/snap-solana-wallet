import { Box, Container } from '@metamask/snaps-sdk/jsx';

import ErrorIcon from '../../../../../images/error.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { getAmountInSol } from '../../selectors';
import type { SendContext } from '../../types';

export type TransactionFailureProps = {
  context: SendContext;
};

export const TransactionFailure = ({ context }: TransactionFailureProps) => {
  const { currencySymbol, preferences } = context;
  const translate = i18n(preferences.locale);
  const amountInSol = getAmountInSol(context);

  return (
    <Container>
      <Box>
        <Box>{null}</Box>
        <ActionHeader
          title={translate('transaction-failure.title')}
          subtitle={translate('transaction-failure.subtitle', {
            amount: amountInSol,
            tokenSymbol: currencySymbol,
          })}
          iconSrc={ErrorIcon}
        />
        <TransactionDetails context={context} />
      </Box>
    </Container>
  );
};
