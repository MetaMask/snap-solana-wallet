import { Button, Card, Flex } from '@chakra-ui/react';
import { KeyringRpcMethod, type KeyringAccount } from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';

export const ClientRequest = () => {
  const invokeSnap = useInvokeSnap();
  const invokeKeyring = useInvokeKeyring();
  const [accounts, setAccounts] = useState<KeyringAccount[]>([]);

  useEffect(() => {
    const fetchAndSetAccounts = async () => {
      const accountsToSet = (await invokeKeyring({
        method: KeyringRpcMethod.ListAccounts,
      })
        .then((accountsResponse) => {
          return accountsResponse ?? [];
        })
        .catch((error) => {
          console.error('Error fetching accounts', error);
          return [];
        })) as KeyringAccount[];
      setAccounts(accountsToSet);
    };
    fetchAndSetAccounts();
  }, []);

  const signRewardsMessage = async () => {
    console.log('signRewardsMessage', accounts);
    const account = accounts[0];
    if (!account) {
      return;
    }

    const message = btoa(`rewards,${account.address},1736660000`);

    await invokeSnap({
      method: TestDappRpcRequestMethod.SignRewardsMessage,
      params: {
        account: {
          address: account.address,
        },
        message,
      },
    });
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>ClientRequest</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex direction="column" gap="4">
          <Button variant="outline" onClick={signRewardsMessage}>
            SignRewardsMessage
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
