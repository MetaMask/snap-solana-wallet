import type { Balance } from '@metamask/keyring-api';
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
import type { TokenRate } from '../../../../core/services/state';
import { addressToCaip10 } from '../../../../core/utils/address-to-caip10';
import { formatCurrency } from '../../../../core/utils/format-currency';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { tokenToFiat } from '../../../../core/utils/token-to-fiat';
import { SendFormNames } from '../../types/form';
import { SendCurrency } from '../../types/send';

type AccountSelectorProps = {
  accounts: SolanaKeyringAccount[];
  balances: Record<string, Balance>;
  tokenRate: TokenRate;
  scope: SolanaCaip2Networks;
  selectedAccountId: string;
  error?: string;
};

export const AccountSelector: SnapComponent<AccountSelectorProps> = ({
  accounts,
  balances,
  tokenRate,
  scope,
  error,
}) => {
  return (
    <Field label="From" error={error}>
      <Selector name={SendFormNames.AccountSelector} title="From">
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
                    tokenRate.conversionRate,
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
