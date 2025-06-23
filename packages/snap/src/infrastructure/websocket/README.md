# WebSocket Implementation (SIP-20)

This directory contains the WebSocket implementation for the Solana wallet snap, following the [SIP-20](https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-20.md) specification for WebSocket support in MetaMask Snaps.

## Architecture

### WebSocketManager (`WebSocketManager.ts`)

- **Low-level WebSocket management**: Handles connection lifecycle using SIP-20 methods
- **Connection methods**: `snap_openWebSocket`, `snap_closeWebSocket`, `snap_sendWebSocketMessage`
- **Event routing**: Processes SIP-20 events (`message`, `open`, `close`)
- **Error handling**: Automatic reconnection with exponential backoff
- **Subscription tracking**: Maps Solana RPC subscription IDs to internal subscriptions

### WebSocketService (`WebSocketService.ts`)

- **Business logic layer**: Integrates with existing `AssetsService` and `TransactionsService`
- **Account subscriptions**: Real-time balance updates for user and token accounts
- **Signature subscriptions**: Transaction confirmation tracking with auto-cleanup
- **Smart detection**: Automatically subscribes to new token accounts
- **Message gap recovery**: HTTP fallback during connection issues

## SIP-20 Compliance

The implementation follows SIP-20 specification:

### Event Handler

```typescript
export const onWebSocketEvent: OnWebSocketEventHandler = async ({ event }) => {
  switch (event.type) {
    case 'message': // Handle incoming messages
    case 'open': // Handle connection opened
    case 'close': // Handle connection closed
  }
};
```

### Message Format

```typescript
// Text messages
{
  type: 'message',
  id: 'connection-id',
  origin: 'wss://example.com',
  data: {
    type: 'text',
    message: '{"jsonrpc":"2.0","method":"accountNotification",...}'
  }
}

// Binary messages
{
  type: 'message',
  id: 'connection-id',
  origin: 'wss://example.com',
  data: {
    type: 'binary',
    message: [123, 34, 106, ...] // byte array
  }
}
```

### WebSocket Methods

```typescript
// Open connection
await snap.request({
  method: 'snap_openWebSocket',
  params: { url: 'wss://solana-rpc.com', protocols: [] },
});

// Send message
await snap.request({
  method: 'snap_sendWebSocketMessage',
  params: { id: 'connection-id', message: JSON.stringify(rpcCall) },
});

// Close connection
await snap.request({
  method: 'snap_closeWebSocket',
  params: { id: 'connection-id' },
});
```

## Usage

### Initialization

```typescript
// Initialize WebSocket subscriptions
await webSocketService.initialize(accounts, Network.Mainnet);
```

### Account Monitoring

```typescript
// Subscribe to account changes
const subscriptionId = await webSocketService.subscribeToAccount(
  accountAddress,
  Network.Mainnet,
);
```

### Transaction Tracking

```typescript
// Subscribe to transaction confirmation
const subscriptionId = await webSocketService.subscribeToSignature(
  transactionSignature,
  Network.Mainnet,
);
```

## Benefits

- **Real-time updates**: Instant balance and transaction notifications
- **Reduced load**: Eliminates HTTP polling overhead
- **Better UX**: Users see changes immediately
- **Reliable**: HTTP fallback ensures robustness
- **Scalable**: Efficient resource usage with dynamic subscriptions

## Migration Strategy

The implementation provides a gradual migration from HTTP polling:

1. **Backwards compatibility**: HTTP polling remains as fallback
2. **Automatic initialization**: WebSocket subscriptions start during account refresh
3. **Progressive enhancement**: Users get real-time updates when available
4. **Graceful degradation**: Falls back to HTTP if WebSocket fails

## Dependencies

- `@metamask/snaps-sdk: ^8.0.0` - For SIP-20 WebSocket support
- `endowment:network-access` - Snap manifest permission
- Solana RPC WebSocket endpoints - Must support `accountSubscribe` and `signatureSubscribe`
