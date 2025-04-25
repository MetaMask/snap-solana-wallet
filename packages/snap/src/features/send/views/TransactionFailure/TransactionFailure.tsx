import { Box, Container } from '@metamask/snaps-sdk/jsx';

import ErrorIcon from '../../../../../images/error.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { getSelectedTokenMetadata, getTokenAmount } from '../../selectors';
import type { SendContext } from '../../types';

export type TransactionFailureProps = {
  context: SendContext;
};

export const TransactionFailure = ({ context }: TransactionFailureProps) => {
  const { preferences } = context;

  const translate = i18n(preferences.locale);

  const { tokenSymbol } = getSelectedTokenMetadata(context);
  const tokenAmount = getTokenAmount(context);

  return (
    <Container>
      <Box>
        <Box>{null}</Box>
        <ActionHeader
          title={translate('send.transaction-failure.title')}
          subtitle={translate('send.transaction-failure.subtitle', {
            amount: tokenAmount ?? '0',
            tokenSymbol,
          })}
          iconSrc={ErrorIcon}
        />
        <TransactionDetails context={context} />
      </Box>
    </Container>
  );
};
