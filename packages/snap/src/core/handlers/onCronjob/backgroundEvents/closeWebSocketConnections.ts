import type { OnCronjobHandler } from '@metamask/snaps-sdk';

import { webSocketConnectionService } from '../../../../snapContext';
import logger from '../../../utils/logger';

export const closeWebSocketConnections: OnCronjobHandler = async () => {
  logger.info('Closing all WebSocket connections via background event');

  await webSocketConnectionService.closeAllConnections();
};
