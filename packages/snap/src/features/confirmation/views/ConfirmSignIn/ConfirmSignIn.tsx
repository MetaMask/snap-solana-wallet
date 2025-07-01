import {
  Address,
  Box,
  Button,
  Container,
  Footer,
  Heading,
  Image,
  Row,
  Section,
  Text,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { Networks, type Network } from '../../../../core/constants/solana';
import { SOL_IMAGE_SVG } from '../../../../core/test/mocks/solana-image-svg';
import type { Preferences } from '../../../../core/types/snap';
import { addressToCaip10 } from '../../../../core/utils/addressToCaip10';
import { i18n } from '../../../../core/utils/i18n';
import type { SolanaKeyringAccount } from '../../../../entities';
import { BasicNullableField } from '../../components/BasicNullableField/BasicNullableField';
import { EstimatedChanges } from '../../components/EstimatedChanges/EstimatedChanges';
import { ConfirmSignInFormNames } from './events';

export type ConfirmSignInProps = {
  params: Partial<{
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: string;
    nonce: string;
    issuedAt: string;
    expirationTime: string;
    notBefore: string;
    requestId: string;
    resources: string[];
  }>;
  origin: string;
  account: SolanaKeyringAccount;
  scope: Network;
  preferences: Preferences;
  networkImage: string | null;
};

export const ConfirmSignIn: SnapComponent<ConfirmSignInProps> = ({
  params,
  origin,
  account,
  scope,
  preferences,
  networkImage,
}) => {
  const translate = i18n(preferences.locale);
  const originHostname = origin ? new URL(origin).hostname : null;

  const {
    domain,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
    notBefore,
    requestId,
    resources,
    address,
  } = params;

  const accountAddressCaip10 = addressToCaip10(scope, account.address);
  const signInAddressCaip10 = address ? addressToCaip10(scope, address) : null;

  const isBadAccount = signInAddressCaip10 !== accountAddressCaip10;
  const isBadDomain = domain !== originHostname;

  return (
    <Container>
      <Box>
        <Box alignment="center" center>
          <Box>{null}</Box>
          <Heading size="lg">{translate('confirmation.signIn.title')}</Heading>
          <Text color="muted" alignment="center">
            {translate('confirmation.signIn.description')}
          </Text>
        </Box>

        {preferences.simulateOnChainActions ? (
          <EstimatedChanges
            changes={null}
            scanStatus={null}
            preferences={preferences}
            scanFetchStatus="fetched"
          />
        ) : null}

        <Section>
          {originHostname ? (
            <Row
              label={translate('confirmation.origin')}
              tooltip={translate('confirmation.origin.tooltip')}
            >
              <Text>{originHostname}</Text>
            </Row>
          ) : null}
          <Row
            variant={isBadDomain ? 'critical' : 'default'}
            label={translate('confirmation.signIn.domain')}
            tooltip={
              isBadDomain
                ? translate('confirmation.signIn.badDomain')
                : undefined
            }
          >
            <Text>
              {domain ?? translate('confirmation.signIn.unknownDomain')}
            </Text>
          </Row>

          <Row
            label={translate('confirmation.signIn.signingInWith')}
            tooltip={
              isBadAccount
                ? translate('confirmation.signIn.badAccount')
                : undefined
            }
            variant={isBadAccount ? 'warning' : 'default'}
          >
            <Address
              address={accountAddressCaip10}
              truncate
              displayName
              avatar
            />
          </Row>
        </Section>

        <Section>
          <Text fontWeight="medium">
            {translate('confirmation.signIn.message')}
          </Text>
          <Text>{statement ?? ''}</Text>

          <BasicNullableField label="URL" value={uri} />

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

          {signInAddressCaip10 ? (
            <Box alignment="space-between" direction="horizontal">
              <Text fontWeight="medium" color="alternative">
                {translate('confirmation.account')}
              </Text>
              <Address
                address={signInAddressCaip10}
                truncate
                displayName
                avatar
              />
            </Box>
          ) : null}

          <BasicNullableField
            label={translate('confirmation.signIn.version')}
            value={version}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.chainId')}
            value={chainId}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.nonce')}
            value={nonce}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.issuedAt')}
            value={issuedAt}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.expirationTime')}
            value={expirationTime}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.notBefore')}
            value={notBefore}
          />
          <BasicNullableField
            label={translate('confirmation.signIn.requestId')}
            value={requestId}
          />

          {resources && resources.length > 0 ? (
            <Box alignment="space-between" direction="vertical">
              <Text fontWeight="medium" color="alternative">
                {translate('confirmation.signIn.resources')}
              </Text>
              <Box direction="vertical">
                {resources.map((resource) => (
                  <Text key={resource}>{resource}</Text>
                ))}
              </Box>
            </Box>
          ) : null}
        </Section>
      </Box>
      <Footer>
        <Button name={ConfirmSignInFormNames.Cancel}>
          {translate('confirmation.cancelButton')}
        </Button>
        <Button
          name={ConfirmSignInFormNames.Confirm}
          variant={isBadDomain ? 'destructive' : 'primary'}
        >
          {translate('confirmation.confirmButton')}
        </Button>
      </Footer>
    </Container>
  );
};
