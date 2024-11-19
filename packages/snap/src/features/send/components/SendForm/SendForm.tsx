import {
  Box,
  Button,
  Container,
  Footer,
  Heading,
} from '@metamask/snaps-sdk/jsx';

import { SendFormNames } from '../../types/form';

export const SendForm = () => {
  return (
    <Container>
      <Box>
        <Heading>Send Form</Heading>
      </Box>
      <Footer>
        <Button name={SendFormNames.Cancel}>Cancel</Button>
        <Button name={SendFormNames.Send}>Send</Button>
      </Footer>
    </Container>
  );
};
