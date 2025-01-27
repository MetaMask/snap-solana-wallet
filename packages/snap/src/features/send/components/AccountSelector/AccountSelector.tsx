import type { Balance } from '@metamask/keyring-api';
import {
  Address,
  Card,
  Field,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import {
  SolanaCaip19Tokens,
  type Network,
} from '../../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../../core/services/keyring/Keyring';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { truncateAddress } from '../../../../core/utils/truncateAddress';

type AccountSelectorProps = {
  name: string;
  scope: Network;
  accounts: SolanaKeyringAccount[];
  balances: Record<string, Record<string, Balance>>;
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
          const balance =
            balances[account.id]?.[`${scope}/${SolanaCaip19Tokens.SOL}`];
          const { amount, unit } = balance ?? {};

          const value =
            amount && unit ? formatTokens(amount, unit, locale) : '';
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
