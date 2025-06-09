import { Box, Button, Icon } from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../../../core/constants/solana';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import type { InstructionParseResult } from '../../../../entities';
import { ConfirmSignAndSendTransactionFormNames } from '../../views/ConfirmTransactionRequest/events';
import { Instruction } from '../Instruction/Instruction';

type AdvancedProps = {
  instructions: InstructionParseResult[];
  showInstructions: boolean;
  locale: Locale;
  scope: Network;
};

export const Advanced = ({
  instructions,
  showInstructions,
  locale,
  scope,
}: AdvancedProps) => {
  const translate = i18n(locale);

  const showInstructionsMode = showInstructions ? 'hide' : 'show';
  const instructionsModeIcon = showInstructions ? 'arrow-up' : 'arrow-down';

  return (
    <Box alignment="start">
      <Button name={ConfirmSignAndSendTransactionFormNames.ShowAdvanced}>
        {translate(`confirmation.advanced.${showInstructionsMode}`)}
        {'&nbsp;'}
        <Icon name={instructionsModeIcon} color="primary" />
      </Button>
      {showInstructions && (
        <Box>
          {instructions.map((instruction) => (
            <Instruction
              locale={locale}
              scope={scope}
              instruction={instruction}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
