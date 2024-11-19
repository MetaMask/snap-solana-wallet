import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { FunctionComponent, ReactNode } from 'react';
import { createContext, useState } from 'react';
import { ThemeProvider } from 'styled-components';

import { dark, light } from './config/theme';
import { NetworkProvider } from './context/network';
import { MetaMaskProvider } from './hooks';
import { getThemePreference, setLocalStorage } from './utils';

export type RootProps = {
  children: ReactNode;
};

type ToggleTheme = () => void;

export const ToggleThemeContext = createContext<ToggleTheme>(
  (): void => undefined,
);

export const Root: FunctionComponent<RootProps> = ({ children }) => {
  const [darkTheme, setDarkTheme] = useState(getThemePreference());

  const toggleTheme: ToggleTheme = () => {
    setLocalStorage('theme', darkTheme ? 'light' : 'dark');
    setDarkTheme(!darkTheme);
  };

  return (
    <ToggleThemeContext.Provider value={toggleTheme}>
      <ThemeProvider theme={darkTheme ? dark : light}>
        <MetaMaskProvider>
          <ChakraProvider value={defaultSystem}>
            <NetworkProvider>
              <main className={darkTheme ? 'dark' : ''}>{children}</main>
            </NetworkProvider>
          </ChakraProvider>
        </MetaMaskProvider>
      </ThemeProvider>
    </ToggleThemeContext.Provider>
  );
};
