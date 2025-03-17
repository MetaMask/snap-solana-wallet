import { Box, Text } from '@metamask/snaps-sdk/jsx';

export const BasicNullableField = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | undefined;
}) =>
  value !== null && value !== undefined ? (
    <Box alignment="space-between" direction="horizontal">
      <Text fontWeight="medium" color="alternative">
        {label}
      </Text>
      <Text>{value}</Text>
    </Box>
  ) : null;
