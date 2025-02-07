import {
  type SnapComponent,
  Address,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Icon,
  Section,
  Skeleton,
  Text,
  Tooltip,
} from '@metamask/snaps-sdk/jsx';

import { Networks } from '../../../../core/constants/solana';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { Advanced } from '../../components/Advanced/Advanced';
import { ConfirmationFormNames, type ConfirmationContext } from '../../types';

export const ConfirmTransaction: SnapComponent<{
  context: ConfirmationContext;
}> = ({ context }) => {
  const translate = i18n(context.preferences.locale);

  const feeInSol = context.feeEstimatedInSol;
  const { nativeToken, name: networkName } = Networks[context.scope];
  const nativePrice = context.tokenPrices[nativeToken.caip19Id]?.price;
  const pricesFetching = context.tokenPricesFetchStatus === 'fetching';
  const pricesError = context.tokenPricesFetchStatus === 'error';

  const feeInFiat =
    feeInSol && nativePrice && !pricesError
      ? formatCurrency(
          tokenToFiat(feeInSol, nativePrice),
          context.preferences.currency,
        )
      : '';

  return (
    <Container>
      <Box>
        <Section>
          {context.account && (
            <Address
              address={addressToCaip10(context.scope, context.account.address)}
              truncate
              displayName
              avatar
            />
          )}
          <Text color="alternative" size="sm">
            {networkName}
          </Text>
        </Section>
        <Box alignment="center" center>
          <Heading>{translate('confirmation.title')}</Heading>
          <Text color="alternative" alignment="center">
            {translate('confirmation.subtitle')}
          </Text>
        </Box>
        <Section>
          <Box alignment="space-between" direction="horizontal">
            <Text color="alternative">{translate('confirmation.fee')}</Text>
            {feeInSol ? (
              <Box direction="horizontal" alignment="center">
                {pricesFetching ? <Skeleton /> : <Text>{feeInFiat}</Text>}
                <Text>
                  {formatTokens(
                    feeInSol,
                    Networks[context.scope].nativeToken.symbol,
                    context.preferences.locale,
                  )}
                </Text>
              </Box>
            ) : (
              <Tooltip content={translate('confirmation.feeError')}>
                <Icon name="warning" />
              </Tooltip>
            )}
          </Box>
        </Section>
        <Advanced
          instructions={context.advanced.instructions}
          showInstructions={context.advanced.shown}
          locale={context.preferences.locale}
          scope={context.scope}
        />
      </Box>
      <Footer>
        <Button name={ConfirmationFormNames.Cancel}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button name={ConfirmationFormNames.Confirm}>
          {translate('confirmation.confirmButton')}
        </Button>
      </Footer>
    </Container>
  );
};
