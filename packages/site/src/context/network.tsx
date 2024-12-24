import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

export enum SolanaCaip2Networks {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Testnet = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
}

export type Network =
  | SolanaCaip2Networks.Mainnet
  | SolanaCaip2Networks.Devnet
  | SolanaCaip2Networks.Testnet;

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
  const [network, setNetwork] = useState<Network>(SolanaCaip2Networks.Mainnet);

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
