import { Box, Button, Container, Footer, Form } from '@metamask/snaps-sdk/jsx';

import { Header } from '../../../../core/components/Header/Header';
import { SendFormNames } from '../../types/form';
import type { SendContext } from '../../types/send';
import { AccountSelector } from '../AccountSelector/AccountSelector';

type SendFormProps = {
  context: SendContext;
};

export const SendForm = ({
  context: { accounts, selectedAccountId, validation },
}: SendFormProps) => {
  return (
    <Container>
      <Box>
        <Header title="Send" backButtonName={SendFormNames.BackButton} />
        <Form name={SendFormNames.Form}>
          <AccountSelector
            error={validation?.[SendFormNames.AccountSelector]?.message ?? ''}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
          />
        </Form>
      </Box>
      <Footer>
        <Button name={SendFormNames.Cancel}>Cancel</Button>
        <Button name={SendFormNames.Send}>Send</Button>
      </Footer>
    </Container>
  );
};
