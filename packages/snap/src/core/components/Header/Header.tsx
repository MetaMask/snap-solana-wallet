import {
  Box,
  Button,
  Heading,
  Icon,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

type HeaderProps = {
  title: string;
  backButtonName: string;
};

export const Header: SnapComponent<HeaderProps> = ({
  title,
  backButtonName,
}) => {
  return (
    <Box direction="horizontal" alignment="space-between" center>
      <Button name={backButtonName}>
        <Icon name="arrow-left" color="primary" size="md" />
      </Button>
      <Heading size="sm">{title}</Heading>
      <Box>{null}</Box>
    </Box>
  );
};
