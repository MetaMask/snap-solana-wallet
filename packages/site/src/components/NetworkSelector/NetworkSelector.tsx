// eslint-disable-next-line @typescript-eslint/no-shadow
import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

import {
  type Network,
  SolanaCaip2Networks,
  useNetwork,
} from '../../context/network';

const networks = {
  [SolanaCaip2Networks.Mainnet]: 'Mainnet',
  [SolanaCaip2Networks.Devnet]: 'Devnet',
  [SolanaCaip2Networks.Testnet]: 'Testnet',
};

export const NetworkSelector: React.FC = () => {
  const { network, setNetwork } = useNetwork();

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      direction="column"
      gap="2"
      marginBottom="5"
      width="full"
    >
      <Text fontWeight="bold">Network</Text>
      <Flex gap="2">
        {Object.keys(networks).map((net) => (
          <Flex gap="2" as="label" key={net}>
            <input
              type="radio"
              name="network"
              value={net}
              checked={network === net}
              onChange={() => setNetwork(net as Network)}
            />
            {networks[net as SolanaCaip2Networks]}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};
