import type { Balance } from '@metamask/keyring-api';
import {
  Card,
  Field,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import type { SolanaTokenMetadata } from '../../../../core/clients/token-metadata-client/types';
import QUESTION_MARK_SVG from '../../../../core/img/question-mark.svg';
import { i18n, type Locale } from '../../../../core/utils/i18n';
import { SendFormNames } from '../../types';

type AssetsSelectorProps = {
  selectedAccountId: string;
  balances: Record<string, Record<string, Balance>>;
  tokenMetadata: Record<string, SolanaTokenMetadata>;
  locale: Locale;
  tokenCaipId: string;
};

export const AssetSelector: SnapComponent<AssetsSelectorProps> = ({
  selectedAccountId,
  balances,
  tokenMetadata,
  locale,
  tokenCaipId,
}) => {
  const translate = i18n(locale);
  const accountAssets = balances[selectedAccountId] ?? {};

  return (
    <Field label={translate('send.assetField')}>
      <Selector
        name={SendFormNames.AssetSelector}
        title={translate('send.assetField')}
        value={tokenCaipId}
      >
        {Object.keys(accountAssets).map((assetCaipId, index) => {
          const asset = accountAssets[assetCaipId] as Balance;
          const metadata = tokenMetadata[assetCaipId];

          return (
            <SelectorOption key={index} value={assetCaipId}>
              <Card
                image={metadata?.imageSvg ?? QUESTION_MARK_SVG}
                title=""
                value={asset.unit ?? 'UNKNOWN'}
              />
            </SelectorOption>
          );
        })}
      </Selector>
    </Field>
  );
};
