import { Address, Box, Link, Section, Text } from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../../../core/domain';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { getSolanaExplorerUrl } from '../../../../core/utils/getSolanaExplorerUrl';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import { truncateInstructionData } from '../../../../core/utils/instructions';
import type { SolanaInstruction } from '../../views/ConfirmTransactionRequest/types';

type InstructionProps = SolanaInstruction & {
  scope: Network;
  locale: Locale;
};

export const Instruction = ({
  programId,
  data,
  scope,
  locale,
}: InstructionProps) => {
  const translate = i18n(locale);

  return (
    <Section alignment="start">
      <Text color="alternative" fontWeight="bold">
        {translate('confirmation.advanced.unknownInstruction')}
      </Text>
      <Box alignment="space-between" direction="horizontal">
        <Text color="alternative" alignment="start">
          {translate('confirmation.advanced.programId')}
        </Text>
        <Link href={getSolanaExplorerUrl(scope, 'address', programId)}>
          <Address
            avatar={false}
            address={addressToCaip10(scope, programId)}
            truncate
          />
        </Link>
      </Box>
      <Box alignment="space-between" direction="horizontal">
        <Text color="alternative">
          {translate('confirmation.advanced.data')}
        </Text>
        <Text>{truncateInstructionData(data)}</Text>
      </Box>
    </Section>
  );
};
