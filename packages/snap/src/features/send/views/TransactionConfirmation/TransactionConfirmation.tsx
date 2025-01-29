import { Box, Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { formatCurrency } from '../../../../core/utils/formatCurrency';
import { formatTokens } from '../../../../core/utils/formatTokens';
import { i18n } from '../../../../core/utils/i18n';
import { tokenToFiat } from '../../../../core/utils/tokenToFiat';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import {
  getSelectedTokenMetadata,
  getSelectedTokenPrice,
  getTokenAmount,
} from '../../selectors';
import { type SendContext } from '../../types';

export enum TransactionConfirmationNames {
  BackButton = 'transaction-confirmation-back-button',
  CancelButton = 'transaction-confirmation-cancel-button',
  ConfirmButton = 'transaction-confirmation-submit-button',
}

type TransactionConfirmationProps = {
  context: SendContext;
};

export const TransactionConfirmation = ({
  context,
}: TransactionConfirmationProps) => {
  const { preferences } = context;
  const translate = i18n(preferences.locale);

  const { tokenImage, tokenSymbol } = getSelectedTokenMetadata(context);
  const tokenAmount = getTokenAmount(context);
  const selectedTokenPrice = getSelectedTokenPrice(context);
  const amountInUserCurrency =
    selectedTokenPrice === undefined
      ? ''
      : formatCurrency(
          tokenToFiat(tokenAmount, selectedTokenPrice),
          preferences.currency,
        );

  return (
    <Container>
      <Box>
        <Navigation
          title={translate('confirmation.title')}
          backButtonName={TransactionConfirmationNames.BackButton}
        />
        <ActionHeader
          title={formatTokens(tokenAmount, tokenSymbol, preferences.locale)}
          subtitle={amountInUserCurrency}
          iconSrc={tokenImage}
        />
        <TransactionDetails context={context} />
      </Box>
      <Footer>
        <Button name={TransactionConfirmationNames.CancelButton}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button name={TransactionConfirmationNames.ConfirmButton}>
          {translate('confirmation.sendButton')}
        </Button>
      </Footer>
    </Container>
  );
};
