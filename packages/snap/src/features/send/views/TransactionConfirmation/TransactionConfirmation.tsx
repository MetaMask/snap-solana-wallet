import { Box, Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { formatCrypto } from '../../../../core/utils/formatCrypto';
import { formatFiat } from '../../../../core/utils/formatFiat';
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
  const {
    preferences: { currency, locale },
  } = context;
  const translate = i18n(locale);

  const { tokenImage, tokenSymbol } = getSelectedTokenMetadata(context);
  const tokenAmount = getTokenAmount(context);
  const selectedTokenPrice = getSelectedTokenPrice(context);
  const amountInUserCurrency =
    selectedTokenPrice === undefined
      ? ''
      : formatFiat(
          tokenToFiat(tokenAmount ?? '0', selectedTokenPrice),
          currency,
          locale,
        );

  return (
    <Container>
      <Box>
        <Navigation
          title={translate('send.confirmation.title')}
          backButtonName={TransactionConfirmationNames.BackButton}
        />
        <ActionHeader
          title={formatCrypto(tokenAmount ?? '0', tokenSymbol, locale)}
          subtitle={amountInUserCurrency}
          iconSrc={tokenImage}
        />
        <TransactionDetails context={context} />
      </Box>
      <Footer>
        <Button name={TransactionConfirmationNames.CancelButton}>
          {translate('send.confirmation.cancelButton')}
        </Button>
        <Button
          name={TransactionConfirmationNames.ConfirmButton}
          loading={context.loading}
          disabled={context.loading}
        >
          {translate('send.confirmation.sendButton')}
        </Button>
      </Footer>
    </Container>
  );
};
