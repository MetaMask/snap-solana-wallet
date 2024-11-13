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
import { useMetaMask, useMetaMaskContext } from '../hooks';
import { isLocalSnap } from '../utils';

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected } = useMetaMask();

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
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {isMetaMaskReady ? (
          <>
            <NetworkSelector />
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
