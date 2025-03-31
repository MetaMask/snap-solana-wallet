/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Text as ChakraText, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';

import { useInvokeMethod } from '../../hooks/useInvokeMethod';
import { toaster } from '../Toaster/Toaster';

export const ProtocolDetails = () => {
  const invokeMethod = useInvokeMethod();

  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [latestBlockhash, setLatestBlockhash] = useState<string | null>(null);

  const cannotCallOnProtocolRequest = () => {
    toaster.create({
      title: 'Cannot call onProtocolRequest yet',
      description:
        'Wait for SIP-36 to be integrated, or switch metamask-extension to branch sip-26',
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
    <Flex direction="column" width="full" marginBottom="5">
      <ChakraText textStyle="2xl" marginBottom="5">
        Protocol Details
      </ChakraText>
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
    </Flex>
  );
};
