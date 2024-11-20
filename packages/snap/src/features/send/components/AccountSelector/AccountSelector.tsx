import {
  Card,
  Field,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { SolanaKeyringAccount } from '../../../../core/services/keyring';
import { SendFormNames } from '../../types/form';

type AccountSelectorProps = {
  accounts: SolanaKeyringAccount[];
  selectedAccountId: string;
  error?: string;
};

export const AccountSelector: SnapComponent<AccountSelectorProps> = ({
  accounts,
  error,
}) => {
  return (
    <Field label="From" error={error}>
      <Selector name={SendFormNames.AccountSelector} title="From">
        {accounts.map((account) => {
          return (
            <SelectorOption value={account.id}>
              <Card title={'Solana Account 1'} value={account.address} />
            </SelectorOption>
          );
        })}
      </Selector>
    </Field>
  );
};
