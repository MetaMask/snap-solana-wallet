import { Flex } from '@chakra-ui/react';
import { useEffect, type ReactNode } from 'react';

import { Card, InstallFlaskButton } from '../components';
import { NetworkSelector } from '../components/NetworkSelector/NetworkSelector';
import { SolanaLogo } from '../components/SolanaLogo';
import { CardContainer, Container, Heading, Span } from '../components/styled';
import { defaultSnapOrigin } from '../config';
import { useMetaMask, useMetaMaskContext } from '../hooks';
import { useShowToasterForResponse } from '../hooks/useToasterForResponse';
import { isLocalSnap } from '../utils';

type PageTemplateProps = {
  children: ReactNode;
  showNetworkSelector?: boolean;
};

export const PageTemplate = ({ children }: PageTemplateProps) => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected } = useMetaMask();

  // Handle JSON-RPC errors globally by showing a toaster
  const { showToasterForResponse } = useShowToasterForResponse();

  useEffect(() => {
    showToasterForResponse({ error }, undefined, {
      title: 'Error',
      description: error?.message,
    });
  }, [error]);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  return (
    <Container>
      <Heading>
        <SolanaLogo size={60} />
        <Span>olana wallet</Span>
      </Heading>
      <CardContainer>
        {isMetaMaskReady ? (
          <>
            <Flex width="full" justifyContent="space-between">
              <NetworkSelector />
            </Flex>
            {children}
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
