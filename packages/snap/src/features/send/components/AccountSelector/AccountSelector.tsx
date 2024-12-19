import type { Balance } from '@metamask/keyring-api';
import {
  Address,
  Card,
  Field,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../../core/services/keyring';
import { addressToCaip10 } from '../../../../core/utils/address-to-caip10';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { truncateAddress } from '../../../../core/utils/truncate-address';

type AccountSelectorProps = {
  name: string;
  scope: Network;
  accounts: SolanaKeyringAccount[];
  balances: Record<string, Balance>;
  price: number;
  selectedAccountId: string;
  locale: Locale;
  currency: string;
  error?: string;
};

export const AccountSelector: SnapComponent<AccountSelectorProps> = ({
  accounts,
  balances,
  price,
  name,
  scope,
  selectedAccountId,
  error,
  locale,
  currency,
}) => {
  const translate = i18n(locale);
  const accountsList = Object.values(accounts);

  return (
    <Field label={translate('send.fromField')} error={error}>
      <Selector name={name} value={selectedAccountId} title="From">
        {accountsList.map((account) => {
          const balance = balances[account.id];
          const { amount, unit } = balance ?? {};

          const value = amount && unit ? formatTokens(amount, unit) : '';
          const extra =
            amount && unit
              ? formatCurrency(tokenToFiat(amount, price), currency)
              : '';

          return (
            <SelectorOption value={account.id}>
              <Card
                value={value}
                extra={extra}
                description={truncateAddress(account.address)}
                title={
                  <Address
                    address={addressToCaip10(scope, account.address)}
                    truncate
                    displayName
                    avatar
                  />
                }
              />
            </SelectorOption>
          );
        })}
      </Selector>
    </Field>
  );
};
