import {
  Address,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Icon,
  Image,
  Section,
  Text,
  Tooltip,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { Networks, type Network } from '../../../../core/constants/solana';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import type { Locale } from '../../../../core/utils/i18n';
import { i18n } from '../../../../core/utils/i18n';
import type { SolanaKeyringAccount } from '../../../../entities';
import { ConfirmSignMessageFormNames } from './events';

export type ConfirmSignMessageProps = {
  message: string;
  account: SolanaKeyringAccount;
  scope: Network;
  locale: Locale;
  networkImage: string | null;
  origin: string;
};

export const ConfirmSignMessage: SnapComponent<ConfirmSignMessageProps> = ({
  message,
  account,
  scope,
  locale,
  networkImage,
  origin,
}) => {
  const translate = i18n(locale);
  const { address } = account;
  const originHostname = origin ? new URL(origin).hostname : null;
  const addressCaip10 = addressToCaip10(scope, address);

  return (
    <Container>
      <Box>
        <Box alignment="center" center>
          <Box>{null}</Box>
          <Heading size="lg">
            {translate('confirmation.signMessage.title')}
          </Heading>
        </Box>

        <Section>
          <Box direction="horizontal" center>
            <Text fontWeight="medium">
              {translate('confirmation.signMessage.message')}
            </Text>
          </Box>
          <Box alignment="space-between">
            <Text>{message}</Text>
          </Box>
        </Section>

        <Section>
          {originHostname ? (
            <Box alignment="space-between" direction="horizontal">
              <Box alignment="space-between" direction="horizontal" center>
                <Text fontWeight="medium" color="alternative">
                  {translate('confirmation.origin')}
                </Text>
                <Tooltip content={translate('confirmation.origin.tooltip')}>
                  <Icon name="question" color="muted" />
                </Tooltip>
              </Box>
              <Text>{originHostname}</Text>
            </Box>
          ) : null}
          <Box alignment="space-between" direction="horizontal">
            <Text fontWeight="medium" color="alternative">
              {translate('confirmation.account')}
            </Text>
            <Address address={addressCaip10} truncate displayName avatar />
          </Box>
          <Box alignment="space-between" direction="horizontal">
            <Text fontWeight="medium" color="alternative">
              {translate('confirmation.network')}
            </Text>
            <Box direction="horizontal" alignment="center">
              <Box alignment="center" center>
                <Image
                  borderRadius="medium"
                  src={networkImage ?? SOL_IMAGE_SVG}
                />
              </Box>
              <Text>{Networks[scope].name}</Text>
            </Box>
          </Box>
        </Section>
      </Box>
      <Footer>
        <Button name={ConfirmSignMessageFormNames.Cancel}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button name={ConfirmSignMessageFormNames.Confirm}>
          {translate('confirmation.confirmButton')}
        </Button>
      </Footer>
    </Container>
  );
};
