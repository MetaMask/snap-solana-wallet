/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Text as ChakraText, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';

import { useInvokeMethod } from '../../hooks/useInvokeMethod';
import { toaster } from '../Toaster/Toaster';

export const OnProtocolRequest = () => {
  const invokeMethod = useInvokeMethod();

  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [latestBlockhash, setLatestBlockhash] = useState<string | null>(null);

  const cannotCallOnProtocolRequest = () => {
    toaster.create({
      title: 'Cannot call onProtocolRequest yet',
      description: 'Must wait for SIP-26 to be integrated',
      action: {
        label: 'View PR',
        onClick: () => {
          window.open(
            'https://github.com/MetaMask/metamask-extension/pull/29887',
            '_blank',
          );
        },
      },
      type: 'info',
    });
  };

  const fetchGenesisHash = async () => {
    cannotCallOnProtocolRequest();
    // const fetchedGenesisHash = await invokeMethodViaChromeRuntime({
    //   method: 'getGenesisHash',
    // });
    // setGenesisHash(fetchedGenesisHash as string);
  };

  const fetchLatestBlockhash = async () => {
    cannotCallOnProtocolRequest();
    // const fetchedLatestBlockhash = await invokeMethodViaChromeRuntime({
    //   method: 'getLatestBlockhash',
    // });
    // setLatestBlockhash(fetchedLatestBlockhash as string);
  };

  //   useEffect(() => {
  //     fetchGenesisHash();
  //     fetchLatestBlockhash();
  //   }, []);

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>OnProtocolRequest</Card.Title>
      </Card.Header>
      <Card.Body>
        <Flex>
          <Button
            variant="ghost"
            colorPalette="purple"
            size="xs"
            onClick={fetchGenesisHash}
            marginRight="1"
          >
            <LuRefreshCw />
          </Button>
          <ChakraText alignSelf="center">Genesis Hash</ChakraText>
          <ChakraText alignSelf="center">{genesisHash}</ChakraText>
        </Flex>
        <Flex>
          <Button
            variant="ghost"
            colorPalette="purple"
            size="xs"
            onClick={fetchLatestBlockhash}
            marginRight="1"
          >
            <LuRefreshCw />
          </Button>
          <ChakraText alignSelf="center">Latest Blockhash</ChakraText>
          <ChakraText alignSelf="center">{latestBlockhash}</ChakraText>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
