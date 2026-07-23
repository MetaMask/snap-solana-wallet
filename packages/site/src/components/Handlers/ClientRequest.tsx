import { Button, Card, Flex } from '@chakra-ui/react';
import type { KeyringAccount } from '@metamask/keyring-api';
import { KeyringRpcMethod } from '@metamask/keyring-api';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { useShowToasterForResponse } from '../../hooks/useToasterForResponse';

export const ClientRequest = () => {
  const invokeSnap = useInvokeSnap();
  const { showToasterForResponse } = useShowToasterForResponse();
  const invokeKeyring = useInvokeKeyring();

  const showSuccessToast = (title: string) =>
    showToasterForResponse(
      { result: 'ok' },
      {
        title,
      },
    );

  const signRewardsMessage = async () => {
    const accountsToSet = (await invokeKeyring({
      method: KeyringRpcMethod.ListAccounts,
    })) as KeyringAccount[];
    const account = accountsToSet[0];
    if (!account) {
      return;
    }
    const { id: accountId, address } = account;

    const timestamp = Math.floor(Date.now() / 1000);

    const response = await invokeSnap({
      method: TestDappRpcRequestMethod.SignRewardsMessage,
      params: {
        accountId,
        message: btoa(`rewards,${address},${timestamp}`),
      },
    });

    showSuccessToast(
      `Successfully signed the rewards message! Signature: ${(response as any).signature}`,
    );
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>ClientRequest</Card.Title>
      </Card.Header>
      <Card.Body>
        <Flex>
          <Button variant="outline" onClick={signRewardsMessage}>
            Sign Rewards Message
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
