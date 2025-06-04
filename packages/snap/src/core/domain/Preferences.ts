import type { Locale } from '../utils/i18n';

export type Preferences = {
  locale: Locale;
  currency: string;
  hideBalances: boolean;
  useSecurityAlerts: boolean;
  useExternalPricingData: boolean;
  simulateOnChainActions: boolean;
  useTokenDetection: boolean;
  batchCheckBalances: boolean;
  displayNftMedia: boolean;
  useNftDetection: boolean;
};
