import {
  Box,
  Button,
  Container,
  Footer,
  Heading,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { Networks } from '../../../../core/constants/solana';
import { i18n } from '../../../../core/utils/i18n';
import { Advanced } from '../../components/Advanced/Advanced';
import { EstimatedChanges } from '../../components/EstimatedChanges/EstimatedChanges';
import { TransactionAlert } from '../../components/TransactionAlert/TransactionAlert';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { ConfirmationFormNames, type ConfirmationContext } from '../../types';

export const ConfirmTransaction: SnapComponent<{
  context: ConfirmationContext;
}> = ({ context }) => {
  const translate = i18n(context.preferences.locale);

  const feeInSol = context.feeEstimatedInSol;
  const { nativeToken } = Networks[context.scope];
  const nativePrice = context.tokenPrices[nativeToken.caip19Id]?.price ?? null;
  const scanIsFetching = context.scanFetchStatus === 'fetching';

  return (
    <Container>
      <Box>
        <TransactionAlert
          scanFetchStatus={context.scanFetchStatus}
          validation={context.scan?.validation ?? null}
          error={context.scan?.error ?? null}
          preferences={context.preferences}
        />
        <Box alignment="center" center>
          <Box>{null}</Box>
          <Heading size="lg">{translate('confirmation.title')}</Heading>
          <Box>{null}</Box>
        </Box>
        <EstimatedChanges
          scanStatus={context.scan?.status ?? null}
          scanFetchStatus={context.scanFetchStatus}
          changes={context.scan?.estimatedChanges ?? null}
          preferences={context.preferences}
        />
        <TransactionDetails
          accountAddress={context.account?.address ?? null}
          scope={context.scope}
          feeInSol={feeInSol}
          nativePrice={nativePrice}
          fetchingPricesStatus={context.tokenPricesFetchStatus}
          preferences={context.preferences}
          networkImage={context.networkImage}
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
        <Button name={ConfirmationFormNames.Confirm} disabled={scanIsFetching}>
          {translate('confirmation.confirmButton')}
        </Button>
      </Footer>
    </Container>
  );
};
