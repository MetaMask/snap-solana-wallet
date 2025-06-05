/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Button,
  IconButton,
  Link,
  Menu,
  Portal,
  Table,
} from '@chakra-ui/react';
import {
  KeyringRpcMethod,
  SolMethod,
  type Balance,
  type KeyringAccount,
} from '@metamask/keyring-api';
import { address as asAddress } from '@solana/kit';
import { Link as RouterLink } from 'gatsby';
import { useEffect, useState } from 'react';
import { LuCopy, LuExternalLink, LuTrash } from 'react-icons/lu';

import { Network } from '../../../../snap/src/core/constants/solana';
import { RpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { buildUrl } from '../../../../snap/src/core/utils/buildUrl';
import { getSolanaExplorerUrl } from '../../../../snap/src/core/utils/getSolanaExplorerUrl';
import { useNetwork } from '../../context/network';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { useShowToasterForResponse } from '../../hooks/useToasterForResponse';
import { EntropySourceBadge } from '../EntropySourceBadge/EntropySourceBadge';
import { toaster } from '../Toaster/Toaster';
import { buildNoOpWithHelloWorldData } from './builders/buildNoOpWithHelloWorldData';
import { buildSendSolTransactionMessage } from './builders/buildSendSolTransactionMessage';

const SOLANA_TOKEN = 'slip44:501';

export const AccountRow = ({
  account,
  onRemove,
}: {
  account: KeyringAccount;
  onRemove: (id: string) => void;
}) => {
  const invokeKeyring = useInvokeKeyring();
  const invokeSnap = useInvokeSnap();
  const { network } = useNetwork();

  const [balance, setBalance] = useState('0');

  const { showToasterForResponse } = useShowToasterForResponse();

  const fetchBalance = async () => {
    const response = (await invokeKeyring({
      method: KeyringRpcMethod.GetAccountBalances,
      params: {
        id: account.id,
        assets: [`${network}/${SOLANA_TOKEN}`],
      },
    })) as Record<string, Balance>;

    setBalance(response?.[`${network}/${SOLANA_TOKEN}`]?.amount ?? '0');
  };

  const handleSend = async (id: string) => {
    await invokeSnap({
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: network,
        account: id,
      },
    });
  };

  const getLifiQuote = async () => {
    const url = buildUrl({
      baseUrl: 'https://li.quest',
      path: '/v1/quote',
      queryParams: {
        fromChain: 'SOL',
        toChain: 'SOL',
        fromToken: 'So11111111111111111111111111111111111111112',
        toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        fromAddress: account.address,
        toAddress: account.address,
        fromAmount: '10000',
      },
    });

    const lifiQuote = await fetch(url).then(async (quote) => quote.json());

    return lifiQuote;
  };

  /**
   * A list of use cases for transactions that can be signed.
   * We display a menu item for each.
   *
   * Each item has a title, shown in UI, and a builder function.
   * The builder function returns a promise that resolves to the transaction or transaction message in base64 encoding.
   */
  const USE_CASES = [
    {
      title: 'No-op with "Hello, world!" data | SDK v1',
      excludeFromNetworks: [],
      builder: async () =>
        buildNoOpWithHelloWorldData(
          asAddress(account.address),
          network as Network,
        ),
    },
    {
      title: 'Send 0.001 SOL to self | SDK v2',
      excludeFromNetworks: [],
      builder: async () =>
        buildSendSolTransactionMessage(
          asAddress(account.address),
          asAddress(account.address),
          1_000_000, // 0.001 SOL
          network as Network,
        ),
    },
    {
      title: 'Swap 0.001 SOL to USDC on LiFi | SDK v2',
      excludeFromNetworks: [Network.Devnet, Network.Testnet, Network.Localnet],
      builder: async () => {
        const lifiQuote = await getLifiQuote();
        return lifiQuote.transactionRequest.data;
      },
    },
  ];

  const handleSignAndSendTransaction = async (
    builder: () => Promise<string>,
  ) => {
    const transactionMessageBase64 = await builder();

    const response = await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: crypto.randomUUID(),
        scope: network,
        account: account.id,
        origin: 'https://example.com',
        request: {
          method: SolMethod.SignAndSendTransaction,
          params: {
            transaction: transactionMessageBase64,
            scope: network,
            account: {
              address: account.address,
            },
          },
        },
      },
    });

    showToasterForResponse(response, {
      title: 'Transaction signed and sent successfully',
      action: {
        label: 'View',
        onClick: () => {
          window.open(
            getSolanaExplorerUrl(
              network as Network,
              'tx',
              (response as any)?.result?.signature,
            ),
          );
        },
      },
    });
  };

  const handleSignTransaction = async (builder: () => Promise<string>) => {
    const transactionMessageBase64 = await builder();

    const response = await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: crypto.randomUUID(),
        scope: network,
        account: account.id,
        origin: 'https://example.com',
        request: {
          method: SolMethod.SignTransaction,
          params: {
            account: {
              address: account.address,
            },
            transaction: transactionMessageBase64,
            scope: network,
            options: {
              commitment: 'finalized',
            },
          },
        },
      },
    });

    showToasterForResponse(response, {
      title: 'Transaction signed successfully',
      description: `Signed transaction: ${
        (response as any)?.result?.signedTransaction
      }`,
    });
  };

  const handleSignMessage = async () => {
    const messageUtf8 =
      "This is the message you are signing. This message might contain something like what the dapp might be able to do once you sign. It also might tell the user why they need or why they should sign this message. Maybe the user will sign the message or maybe they won't. At the end of the day its their choice.";
    const messageBase64 = btoa(messageUtf8);

    const response = await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: crypto.randomUUID(),
        scope: network,
        account: account.id,
        origin: 'https://example.com',
        request: {
          method: SolMethod.SignMessage,
          params: {
            message: messageBase64,
            account: {
              address: account.address,
            },
          },
        },
      },
    });

    showToasterForResponse(response, {
      title: 'Message signed successfully',
      description: `Signature: ${(response as any)?.result?.signature}`,
    });
  };

  const handleSignIn = async () => {
    const requestId = crypto.randomUUID();
    const params = {
      domain: 'example.com',
      address: 'Sol11111111111111111111111111111111111111112',
      statement: 'I accept the terms of service',
      uri: 'https://example.com/login',
      version: '1',
      chainId: 'solana:101',
      nonce: '32891756',
      issuedAt: '2024-01-01T00:00:00.000Z',
      expirationTime: '2024-01-02T00:00:00.000Z',
      notBefore: '2023-12-31T00:00:00.000Z',
      requestId,
      resources: [
        'ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/',
        'https://example.com/my-web2-claim.json',
      ],
    };

    const response = await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: requestId,
        scope: network,
        account: account.id,
        request: {
          method: SolMethod.SignIn,
          params,
        },
      },
    });

    showToasterForResponse(response, {
      title: 'Signed in successfully',
      description: `Signature: ${(response as any)?.result?.signature}`,
    });
  };

  useEffect(() => {
    fetchBalance();
  }, [account.id]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toaster.create({
      description: 'Address copied',
      type: 'info',
    });
  };

  return (
    <Table.Row key={account.id}>
      <Table.Cell>
        <EntropySourceBadge
          entropySource={account.options?.entropySource?.toString()}
        />
      </Table.Cell>
      <Table.Cell fontFamily="monospace">
        <RouterLink to={`/${account.id}`}>
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </RouterLink>
        <IconButton
          marginLeft="1"
          onClick={() => handleCopy(account.address)}
          aria-label="Copy"
          size="sm"
          variant="ghost"
          colorPalette="purple"
        >
          <LuCopy />
        </IconButton>
        <Link
          colorPalette="purple"
          href={getSolanaExplorerUrl(
            network as Network,
            'address',
            account.address,
          )}
          target="_blank"
          rel="noreferrer"
          marginLeft="3"
        >
          <LuExternalLink />
        </Link>
      </Table.Cell>
      <Table.Cell>{balance} SOL </Table.Cell>
      <Table.Cell textAlign="end">
        <Button onClick={fetchBalance}>Fetch</Button>
        <Button
          colorPalette="purple"
          marginLeft="1"
          onClick={async () => handleSend(account.id)}
        >
          Send
        </Button>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button marginLeft="1" colorPalette="cyan">
              Sign & Send Tx
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {USE_CASES.filter(
                  (signableTransaction) =>
                    !signableTransaction.excludeFromNetworks.includes(
                      network as Network,
                    ),
                ).map((signableTransaction) => (
                  <Menu.Item
                    key={signableTransaction.title}
                    value={signableTransaction.title}
                    onClick={async () =>
                      handleSignAndSendTransaction(signableTransaction.builder)
                    }
                  >
                    {signableTransaction.title}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button marginLeft="1" colorPalette="pink">
              Sign Tx
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {USE_CASES.filter(
                  (signableTransaction) =>
                    !signableTransaction.excludeFromNetworks.includes(
                      network as Network,
                    ),
                ).map((signableTransaction) => (
                  <Menu.Item
                    key={signableTransaction.title}
                    value={signableTransaction.title}
                    onClick={async () =>
                      handleSignTransaction(signableTransaction.builder)
                    }
                  >
                    {signableTransaction.title}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button
          colorPalette="orange"
          marginLeft="1"
          onClick={handleSignMessage}
        >
          Sign msg
        </Button>
        <Button colorPalette="green" marginLeft="1" onClick={handleSignIn}>
          Sign In
        </Button>
        <Button
          variant="ghost"
          colorPalette="purple"
          marginLeft="1"
          size="xs"
          onClick={() => onRemove(account.id)}
        >
          <LuTrash />
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
