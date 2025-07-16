/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Text as ChakraText, Flex } from '@chakra-ui/react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeSnap } from '../../hooks';
import { useShowToasterForResponse } from '../../hooks/useToasterForResponse';

export const WebSockets = () => {
  const invokeSnap = useInvokeSnap();
  const { showToasterForResponse } = useShowToasterForResponse();

  const showSuccessToast = (title: string) =>
    showToasterForResponse(
      { result: 'ok' },
      {
        title,
      },
    );

  const listConnections = async () => {
    await invokeSnap({
      method: TestDappRpcRequestMethod.ListWebSockets,
    });
    showSuccessToast('Initiated WebSocket connections to all active networks');
  };

  const listSubscriptions = async () => {
    await invokeSnap({
      method: TestDappRpcRequestMethod.ListSubscriptions,
    });
    showSuccessToast('Listed subscriptions');
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>WebSockets</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex direction="column" gap="4">
          <Flex direction="column" gap="1">
            <ChakraText>Connections</ChakraText>
            <Button variant="outline" onClick={listConnections}>
              List connections
            </Button>
          </Flex>
          <Flex direction="column" gap="1">
            <ChakraText>Subscriptions</ChakraText>
            <Flex gap="1">
              <Button variant="outline" onClick={listSubscriptions}>
                List subscriptions
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
