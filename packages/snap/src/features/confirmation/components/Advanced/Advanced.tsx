import { Box, Button, Icon, type SnapComponent } from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../../../core/constants/solana';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import { ConfirmationFormNames, type SolanaInstruction } from '../../types';
import { Instruction } from '../Instruction/Instruction';

type AdvancedProps = {
  instructions: SolanaInstruction[];
  showInstructions: boolean;
  locale: Locale;
  scope: Network;
};

export const Advanced: SnapComponent<AdvancedProps> = ({
  instructions,
  showInstructions,
  locale,
  scope,
}) => {
  const translate = i18n(locale);

  const showInstructionsMode = showInstructions ? 'hide' : 'show';
  const instructionsModeIcon = showInstructions ? 'arrow-up' : 'arrow-down';

  return (
    <Box alignment="start">
      <Button name={ConfirmationFormNames.ShowAdvanced}>
        {translate(`confirmation.advanced.${showInstructionsMode}`)}
        <Icon name={instructionsModeIcon} color="primary" />
      </Button>
      {showInstructions && (
        <Box>
          {instructions.map((instruction) => (
            <Instruction locale={locale} scope={scope} {...instruction} />
          ))}
        </Box>
      )}
    </Box>
  );
};
