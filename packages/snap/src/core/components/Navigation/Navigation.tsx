import {
  Box,
  Button,
  Heading,
  Icon,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

type NavigationProps = {
  title: string;
  backButtonName?: string;
};

export const Navigation: SnapComponent<NavigationProps> = ({
  title,
  backButtonName,
}) => {
  return (
    <Box direction="horizontal" alignment="space-between" center>
      {backButtonName ? (
        <Button name={backButtonName}>
          <Icon name="arrow-left" color="primary" size="md" />
        </Button>
      ) : null}
      <Heading size="sm">{title}</Heading>
      <Box direction="horizontal">
        <Box>{null}</Box>
        <Box>{null}</Box>
        <Box>{null}</Box>
        <Box>{null}</Box>
      </Box>
    </Box>
  );
};
