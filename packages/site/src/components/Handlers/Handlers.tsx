import { Text as ChakraText, Flex, Stack } from '@chakra-ui/react';

import { OnProtocolRequest } from './OnProtocolRequest';
import { WebSockets } from './WebSockets';

export const Handlers = () => (
  <Flex direction="column" width="full" marginBottom="5">
    <ChakraText textStyle="2xl" marginBottom="5">
      Handlers
    </ChakraText>
    <Stack direction="row" gap="5" wrap="wrap">
      <OnProtocolRequest />
      <WebSockets />
    </Stack>
  </Flex>
);
