import {
  Box,
  Button,
  Container,
  Footer,
  Heading,
} from '@metamask/snaps-sdk/jsx';

import { Networks } from '../../../../core/domain';
import { i18n } from '../../../../core/utils/i18n';
import { Advanced } from '../../components/Advanced/Advanced';
import { EstimatedChanges } from '../../components/EstimatedChanges/EstimatedChanges';
import { TransactionAlert } from '../../components/TransactionAlert';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { ConfirmSignAndSendTransactionFormNames } from './events';
import { type ConfirmTransactionRequestContext } from './types';

export const ConfirmTransactionRequest = ({
  context,
}: {
  context: ConfirmTransactionRequestContext;
}) => {
  const translate = i18n(context.preferences.locale);

  const feeInSol = context.feeEstimatedInSol;
  const { nativeToken } = Networks[context.scope];
  const nativePrice = context.tokenPrices[nativeToken.caip19Id]?.price ?? null;

  const shouldDisableConfirmButton =
    context.scanFetchStatus === 'fetching' || context.scan?.status === 'ERROR';

  return (
    <Container>
      <Box>
        {context.preferences.useSecurityAlerts ? (
          <TransactionAlert
            scanFetchStatus={context.scanFetchStatus}
            validation={context.scan?.validation ?? null}
            error={context.scan?.error ?? null}
            preferences={context.preferences}
          />
        ) : null}
        <Box alignment="center" center>
          <Box>{null}</Box>
          <Heading size="lg">{translate('confirmation.title')}</Heading>
          <Box>{null}</Box>
        </Box>
        {context.preferences.simulateOnChainActions ? (
          <EstimatedChanges
            scanStatus={context.scan?.status ?? null}
            scanFetchStatus={context.scanFetchStatus}
            changes={context.scan?.estimatedChanges ?? null}
            preferences={context.preferences}
          />
        ) : null}
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
        <Button name={ConfirmSignAndSendTransactionFormNames.Cancel}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button
          name={ConfirmSignAndSendTransactionFormNames.Confirm}
          disabled={shouldDisableConfirmButton}
        >
          {translate('confirmation.confirmButton')}
        </Button>
      </Footer>
    </Container>
  );
};
