import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

import { Network } from '../../../snap/src/core/constants/solana';

export type NetworkContextType = {
  network: string;
  setNetwork: Dispatch<SetStateAction<Network>>;
};

export const NetworkContext = createContext<NetworkContextType | null>(null);

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [network, setNetwork] = useState<Network>(Network.Mainnet);

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
};
