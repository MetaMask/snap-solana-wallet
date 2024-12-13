import { Box, Container, Spinner, Text } from '@metamask/snaps-sdk/jsx';

export const SendPending = () => {
  return (
    <Container>
      <Box direction="horizontal" alignment="center">
        <Box direction="vertical" alignment="center">
          <Text>Pending</Text>
          <Spinner />
        </Box>
      </Box>
    </Container>
  );
};
