/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Flex } from '@chakra-ui/react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';

export const Accounts = () => {
  const invokeSnap = useInvokeSnap();

  const synchronize = async () => {
    const promise = invokeSnap({
      method: TestDappRpcRequestMethod.SynchronizeAccounts,
    });

    toaster.promise(promise, {
      success: {
        title: 'Successfully synced accounts!',
        description: 'Accounts synced successfully',
      },
      error: {
        title: 'Sync failed',
        description: 'Something went wrong with the sync',
      },
      loading: { title: 'Syncing accounts...', description: 'Please wait' },
    });
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Accounts</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex direction="column" gap="4">
          <Flex direction="column" gap="1">
            <Button variant="outline" onClick={synchronize}>
              Synchronize
            </Button>
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
