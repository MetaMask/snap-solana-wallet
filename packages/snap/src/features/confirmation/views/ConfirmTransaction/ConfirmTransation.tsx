import {
  type SnapComponent,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Text,
} from '@metamask/snaps-sdk/jsx';

import { Networks } from '../../../../core/constants/solana';
import { i18n } from '../../../../core/utils/i18n';
import { Advanced } from '../../components/Advanced/Advanced';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { ConfirmationFormNames, type ConfirmationContext } from '../../types';

export const ConfirmTransaction: SnapComponent<{
  context: ConfirmationContext;
}> = ({ context }) => {
  const translate = i18n(context.preferences.locale);

  const feeInSol = context.feeEstimatedInSol;
  const { nativeToken } = Networks[context.scope];
  const nativePrice = context.tokenPrices[nativeToken.caip19Id]?.price;

  return (
    <Container>
      <Box>
        <Box alignment="center" center>
          <Heading>{translate('confirmation.title')}</Heading>
          <Text color="alternative" alignment="center">
            {translate('confirmation.subtitle')}
          </Text>
        </Box>
        <TransactionDetails
          accountAddress={context.account?.address ?? null}
          scope={context.scope}
          feeInSol={feeInSol}
          nativePrice={nativePrice}
          fetchingPricesStatus={context.tokenPricesFetchStatus}
          preferences={context.preferences}
        />
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
