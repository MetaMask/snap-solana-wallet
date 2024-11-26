import type { Balance } from '@metamask/keyring-api';
import type { GetCurrencyRateResult } from '@metamask/snaps-sdk';
import {
  Address,
  Card,
  Field,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { SolanaCaip2Networks } from '../../../../core/constants/solana';
import type { SolanaKeyringAccount } from '../../../../core/services/keyring';
import { addressToCaip10 } from '../../../../core/utils/address-to-caip10';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { SendCurrency } from '../../views/SendForm/types';

type AccountSelectorProps = {
  name: string;
  scope: SolanaCaip2Networks;
  accounts: SolanaKeyringAccount[];
  balances: Record<string, Balance>;
  currencyRate: GetCurrencyRateResult;
  selectedAccountId: string;
  error?: string;
};

export const AccountSelector: SnapComponent<AccountSelectorProps> = ({
  name,
  scope,
  accounts,
  selectedAccountId,
  balances,
  currencyRate,
  error,
}) => {
  return (
    <Field label="From" error={error}>
      <Selector name={name} value={selectedAccountId} title="From">
        {accounts.map((account) => {
          return (
            <SelectorOption value={account.id}>
              <Card
                value={formatTokens(
                  balances[account.id]?.amount ?? '0',
                  balances[account.id]?.unit ?? SendCurrency.SOL,
                )}
                extra={formatCurrency(
                  tokenToFiat(
                    balances[account.id]?.amount ?? '0',
                    currencyRate?.conversionRate ?? 0,
                  ),
                )}
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
