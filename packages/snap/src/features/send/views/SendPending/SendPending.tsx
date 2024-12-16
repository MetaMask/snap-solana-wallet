import { Box, Container } from '@metamask/snaps-sdk/jsx';

import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import type { SendContext } from '../../types';

export type SendPendingProps = {
  context: SendContext;
};

export const SendPending = ({ context }: SendPendingProps) => {
  const translate = i18n(context.locale);

  return (
    <Container>
      <Box>
        <Box>{null}</Box>
        <ActionHeader
          title={translate('send-pending.title')}
          subtitle={translate('send-pending.subtitle')}
          isLoading
        />
        <TransactionDetails context={context} />
      </Box>
    </Container>
  );
};
