import { Button, Flex } from '@chakra-ui/react';

import { Card, InstallFlaskButton, SolanaLogo } from '../components';
import { Accounts } from '../components/Accounts/Accounts';
import { NetworkSelector } from '../components/NetworkSelector/NetworkSelector';
import {
  CardContainer,
  Container,
  ErrorMessage,
  Heading,
  Span,
} from '../components/styled';
import { defaultSnapOrigin } from '../config';
import { useInvokeSnap, useMetaMask, useMetaMaskContext } from '../hooks';
import { isLocalSnap } from '../utils';

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected } = useMetaMask();
  const invokeSnap = useInvokeSnap();

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  const handleSend = async () => {
    await invokeSnap({ method: 'startSendSolanaFlow' });
  };

  return (
    <Container>
      <Heading>
        <SolanaLogo size={60} />
        <Span>olana wallet</Span>
      </Heading>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {isMetaMaskReady ? (
          <>
            <Flex width="full" justifyContent="space-between">
              <NetworkSelector />
              <Button colorPalette="purple" marginLeft="3" onClick={handleSend}>
                Send
              </Button>
            </Flex>
            <Accounts />
          </>
        ) : (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
      </CardContainer>
    </Container>
  );
};

export default Index;
