/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Flex } from '@chakra-ui/react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeSnap } from '../../hooks';
import { useShowToasterForResponse } from '../../hooks/useToasterForResponse';

export const WebSockets = () => {
  const invokeSnap = useInvokeSnap();
  const { showToasterForResponse } = useShowToasterForResponse();

  const setupAllConnections = async () => {
    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Initiated WebSocket connections to all active networks',
        description: `Inspect the offscreen console`,
      },
    );

    await invokeSnap({
      method: TestDappRpcRequestMethod.TestSetupAllConnections,
    });
  };

  const closeAllConnections = async () => {
    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Closed all WebSocket connections',
      },
    );
    await invokeSnap({
      method: TestDappRpcRequestMethod.TestCloseAllConnections,
    });
  };

  const listSubscriptions = async () => {
    await invokeSnap({
      method: TestDappRpcRequestMethod.TestListSubscriptions,
    });

    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Listed subscriptions',
        description: `Inspect the offscreen console`,
      },
    );
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>WebSockets</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex>
          <Button
            variant="outline"
            onClick={setupAllConnections}
            marginRight="1"
          >
            Setup all connections
          </Button>
          <Button
            variant="outline"
            onClick={closeAllConnections}
            marginRight="1"
          >
            Close all connections
          </Button>
        </Flex>
        <Flex>
          <Button variant="outline" onClick={listSubscriptions} marginRight="1">
            List subscriptions
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
