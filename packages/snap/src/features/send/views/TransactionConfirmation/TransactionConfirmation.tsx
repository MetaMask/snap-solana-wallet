import { Box, Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import SolanaLogo from '../../../../../images/coin.svg';
import { ActionHeader } from '../../../../core/components/ActionHeader/ActionHeader';
import { Navigation } from '../../../../core/components/Navigation/Navigation';
import { formatTokens } from '../../../../core/utils/format-tokens';
import { i18n } from '../../../../core/utils/i18n';
import { TransactionDetails } from '../../components/TransactionDetails/TransactionDetails';
import { getAmountInSol } from '../../selectors';
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
  const { currencySymbol, preferences } = context;
  const translate = i18n(preferences.locale);
  const amountInSol = getAmountInSol(context);

  return (
    <Container>
      <Box>
        <Navigation
          title={translate('confirmation.title')}
          backButtonName={TransactionConfirmationNames.BackButton}
        />
        <ActionHeader
          title={translate('confirmation.heading', {
            amount: formatTokens(amountInSol, ''),
            tokenSymbol: currencySymbol,
          })}
          subtitle={translate('confirmation.subheading')}
          iconSrc={SolanaLogo}
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
