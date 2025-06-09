import { Address, Box, Link, Section, Text } from '@metamask/snaps-sdk/jsx';
import { isAddress } from '@solana/kit';

import type { Network } from '../../../../core/constants/solana';
import { deserialize } from '../../../../core/serialization/deserialize';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { getSolanaExplorerUrl } from '../../../../core/utils/getSolanaExplorerUrl';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import type { InstructionParseResult } from '../../../../entities';
import { truncateInstructionData } from '../../../../entities';

type InstructionProps = {
  instruction: InstructionParseResult;
  scope: Network;
  locale: Locale;
};

/**
 * Format the instruction type to a human readable string,
 * by splitting a PascalCase string into words,
 * and capitalizing the first letter of each word.
 *
 * @example
 * ```ts
 * formatInstructionType('InitializeMint') // 'Initialize Mint'
 * ```
 * @param type - The instruction type.
 * @returns The formatted instruction type.
 */
const fromPascalCaseToCapitalizedWords = (type: string): string => {
  return type
    .replace(/([A-Z])/gu, ' $1')
    .trim()
    .replace(/^./u, (str) => str.toUpperCase());
};

const LinkToExplorer = ({
  address,
  scope,
}: {
  address: string;
  scope: Network;
}) => (
  <Link href={getSolanaExplorerUrl(scope, 'address', address)}>
    <Address
      avatar={false}
      address={addressToCaip10(scope, address)}
      truncate
    />
  </Link>
);

export const Instruction = ({
  instruction,
  scope,
  locale,
}: InstructionProps) => {
  const translate = i18n(locale);
  const { type, encoded, parsed } = instruction;
  const { programAddress, dataBase58 } = encoded;
  const isParseSuccess = parsed !== null;
  const typeFormatted = fromPascalCaseToCapitalizedWords(type);

  return (
    <Section alignment="start">
      <Text color="alternative" fontWeight="bold">
        {typeFormatted}
      </Text>
      <Box alignment="space-between" direction="horizontal">
        <Text color="alternative" alignment="start">
          {translate('confirmation.advanced.programId')}
        </Text>
        <LinkToExplorer address={programAddress} scope={scope} />
      </Box>
      {isParseSuccess &&
        Object.entries(parsed.accounts ?? {}).map(([key, value]) => (
          <Box alignment="space-between" direction="horizontal">
            <Text color="alternative">
              {fromPascalCaseToCapitalizedWords(key)}
            </Text>
            {isAddress(value.address) ? (
              <LinkToExplorer address={value.address} scope={scope} />
            ) : (
              <Text>{deserialize(value.address)?.toString() ?? ''}</Text>
            )}
          </Box>
        ))}
      {isParseSuccess &&
        Object.entries(parsed.data).map(([key, value]) => (
          <Box alignment="space-between" direction="horizontal">
            <Text color="alternative">
              {fromPascalCaseToCapitalizedWords(key)}
            </Text>
            {isAddress(value) ? (
              <LinkToExplorer address={value} scope={scope} />
            ) : (
              <Text>{deserialize(value)?.toString() ?? ''}</Text>
            )}
          </Box>
        ))}
      {!isParseSuccess && (
        <Box alignment="space-between" direction="horizontal">
          <Text color="alternative">
            {translate('confirmation.advanced.data')}
          </Text>
          <Text>{truncateInstructionData(dataBase58)}</Text>
        </Box>
      )}
    </Section>
  );
};
