import {
  Box,
  Button,
  Container,
  Footer,
  Form,
  Field,
  Icon,
  Input,
  IconName,
} from '@metamask/snaps-sdk/jsx';

import { Header } from '../../../../core/components/Header/Header';
import { SendFormNames } from '../../types/form';
import type { SendContext } from '../../types/send';
import { AccountSelector } from '../AccountSelector/AccountSelector';

type SendFormProps = {
  context: SendContext;
};

export const SendForm = ({
  context: {
    accounts,
    selectedAccountId,
    validation,
    clearToField,
    showClearButton,
  },
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
          <Field
            label="To account"
            error={validation?.[SendFormNames.To]?.message ?? ''}
          >
            <Input
              name={SendFormNames.To}
              placeholder="Enter receiving address"
              value={clearToField ? '' : undefined}
            />
            {showClearButton && (
              <Box>
                <Button name={SendFormNames.Clear}>
                  <Icon name={IconName.Close} color="primary" />
                </Button>
              </Box>
            )}
          </Field>
        </Form>
      </Box>
      <Footer>
        <Button name={SendFormNames.Cancel}>Cancel</Button>
        <Button name={SendFormNames.Send}>Send</Button>
      </Footer>
    </Container>
  );
};
