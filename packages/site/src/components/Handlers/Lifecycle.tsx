/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Flex } from '@chakra-ui/react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeSnap } from '../../hooks';
import { useShowToasterForResponse } from '../../hooks/useToasterForResponse';

export const Lifecycle = () => {
  const invokeSnap = useInvokeSnap();
  const { showToasterForResponse } = useShowToasterForResponse();

  const onStart = async () => {
    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Simulated OnStart lifecycle event',
      },
    );
    await invokeSnap({
      method: TestDappRpcRequestMethod.TestOnStart,
    });
  };

  const onInstall = async () => {
    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Simulated OnInstall lifecycle event',
      },
    );
    await invokeSnap({
      method: TestDappRpcRequestMethod.TestOnInstall,
    });
  };

  const onUpdate = async () => {
    showToasterForResponse(
      { result: 'ok' },
      {
        title: 'Simulated OnUpdate lifecycle event',
      },
    );
    await invokeSnap({
      method: TestDappRpcRequestMethod.TestOnUpdate,
    });
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Lifecycle</Card.Title>
        <Card.Description>
          Simulate the Snap's lifecycle events
        </Card.Description>
      </Card.Header>
      <Card.Body gap="2">
        <Flex>
          <Button variant="outline" onClick={onStart} marginRight="1">
            OnStart
          </Button>
          <Button variant="outline" onClick={onInstall} marginRight="1">
            OnInstall
          </Button>
        </Flex>
        <Flex>
          <Button variant="outline" onClick={onUpdate} marginRight="1">
            OnUpdate
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
