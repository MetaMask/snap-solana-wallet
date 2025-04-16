import { Badge } from '@chakra-ui/react';

/* eslint-disable no-bitwise */
export const EntropySourceBadge = ({
  entropySource = '',
}: {
  entropySource?: string | undefined;
}) => {
  const entropySourceColors = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'blue',
    'cyan',
    'purple',
    'pink',
  ];

  // Simple string hash function that deterministically maps the entropy source to a number.
  // We will use this number to pick a color from the list above.
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    // Ensure the hash is non-negative for the modulo operation
    return Math.abs(hash);
  };

  // Calculate the index based on the hash of the entropy source
  const colorIndex = hashCode(entropySource) % entropySourceColors.length;
  const selectedColor = entropySourceColors[colorIndex];

  return (
    <Badge variant="solid" colorPalette={selectedColor as any}>
      {entropySource.slice(0, 3)}...{entropySource.slice(-2)}
    </Badge>
  );
};
