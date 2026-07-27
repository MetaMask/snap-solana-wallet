import { Button, Link } from '@chakra-ui/react';
import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { useMetaMask, useRequestSnap } from '../hooks';
import { shouldDisplayReconnectButton } from '../utils';

const ButtonText = styled.span`
  margin-left: 1rem;
`;

const ConnectedContainer = styled.div`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  font-weight: bold;
  padding: 1.2rem;
`;

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const InstallFlaskButton = () => (
  <Link colorPalette="purple" href="https://metamask.io/flask/" target="_blank">
    <FlaskFox />
    <ButtonText>Install MetaMask Flask</ButtonText>
  </Link>
);

export const ConnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>Connect</ButtonText>
    </Button>
  );
};

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>Reconnect</ButtonText>
    </Button>
  );
};

export const HeaderButtons = () => {
  const requestSnap = useRequestSnap();
  const { isFlask, installedSnap } = useMetaMask();

  if (!isFlask && !installedSnap) {
    return <InstallFlaskButton />;
  }

  if (!installedSnap) {
    return <ConnectButton colorPalette="gray" onClick={requestSnap} />;
  }

  if (shouldDisplayReconnectButton(installedSnap)) {
    return <ReconnectButton colorPalette="gray" onClick={requestSnap} />;
  }

  return (
    <ConnectedContainer>
      <ConnectedIndicator />
      <ButtonText>Connected</ButtonText>
    </ConnectedContainer>
  );
};
