import { Flex, Table, Text as ChakraText, Button } from '@chakra-ui/react';

export const Accounts = () => {
  return (
    <Flex direction="column" width="full">
      <Flex align="center" justifyContent="space-between">
        <ChakraText textStyle="2xl" marginBottom="5">
          Accounts
        </ChakraText>
        <Button colorPalette="purple">Add account</Button>
      </Flex>
      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body></Table.Body>
      </Table.Root>
    </Flex>
  );
};
