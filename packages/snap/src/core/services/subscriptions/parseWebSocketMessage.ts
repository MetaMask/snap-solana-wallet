import type { WebSocketMessage } from '@metamask/snaps-sdk';

/**
 * A message that we receive from the RPC WebSocket server after a subscription is confirmed.
 * It contains the notification data we subscribed to.
 */
export type JsonRpcWebSocketMessage<TNotification> = {
  jsonrpc: string;
  method: string;
  params: {
    subscription: number;
    result: TNotification;
  };
};

// export type WebSocketMessageWithJsonParsed<TNotification> = WebSocketMessage & {
//   jsonParsed: {
//     jsonrpc: string;
//     method: string;
//     params: {
//       subscription: number;
//       result: TNotification;
//     };
//   };
// };

export const parseWebSocketMessage = <TNotification>(
  event: WebSocketMessage,
): JsonRpcWebSocketMessage<TNotification> => {
  const { data } = event;
  let jsonParsed: any;

  // Handle SIP-20 message format
  if (data && typeof data === 'object' && 'type' in data) {
    // This is already a SIP-20 formatted message data
    if (data.type === 'text') {
      jsonParsed =
        typeof data.message === 'string'
          ? JSON.parse(data.message)
          : data.message;
    } else if (data.type === 'binary') {
      // Convert binary message to string and parse
      const binaryArray = data.message;
      const messageString = String.fromCharCode(...binaryArray);
      jsonParsed = JSON.parse(messageString);
    } else {
      throw new Error('Unknown message data');
    }
  } else {
    // Fallback for direct message parsing
    jsonParsed = typeof data === 'string' ? JSON.parse(data) : data;
  }

  return jsonParsed;
};
