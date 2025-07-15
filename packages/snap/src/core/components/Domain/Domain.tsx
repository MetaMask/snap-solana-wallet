import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Link } from '@metamask/snaps-sdk/jsx';

import type { Network } from '../../constants/solana';
import { getSolanaExplorerUrl } from '../../utils/getSolanaExplorerUrl';

export const Domain: SnapComponent<{
  domain: string;
  scope: Network;
  address: string;
}> = ({ domain, scope, address }) => {
  return (
    <Box direction="horizontal" alignment="center">
      {/* TODO: Bring it back when there is a smaller avatar option */}
      {/* <Avatar size="sm" address={addressToCaip10(scope, address)} /> */}
      <Link href={getSolanaExplorerUrl(scope, 'address', address)}>
        {domain}
      </Link>
    </Box>
  );
};
