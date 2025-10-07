/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Flex } from '@chakra-ui/react';
import type { KeyringAccount } from '@metamask/keyring-api';
import { KeyringRpcMethod } from '@metamask/keyring-api';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';

export const Accounts = () => {
  const invokeSnap = useInvokeSnap();
  const invokeKeyring = useInvokeKeyring();

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

  const onAccountSelected = async () => {
    const accountList = ((await invokeKeyring({
      method: KeyringRpcMethod.ListAccounts,
    })) || []) as KeyringAccount[];

    const account = accountList[0];
    if (!account) {
      throw new Error('No account found');
    }

    await invokeSnap({
      method: TestDappRpcRequestMethod.OnAccountSelected,
      params: {
        account: account?.id,
      },
    });
  };

  const onAccountUnselected = async () => {
    const accountList = ((await invokeKeyring({
      method: KeyringRpcMethod.ListAccounts,
    })) || []) as KeyringAccount[];

    const account = accountList[0];
    if (!account) {
      throw new Error('No account found');
    }
    await invokeSnap({
      method: TestDappRpcRequestMethod.OnAccountUnselected,
      params: {
        account: account?.id,
      },
    });
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Accounts</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex direction="column" gap="4">
          <Button variant="outline" onClick={synchronize}>
            Synchronize
          </Button>
          <Button variant="outline" onClick={onAccountSelected}>
            OnAccountSelected
          </Button>
          <Button variant="outline" onClick={onAccountUnselected}>
            OnAccountUnselected
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
