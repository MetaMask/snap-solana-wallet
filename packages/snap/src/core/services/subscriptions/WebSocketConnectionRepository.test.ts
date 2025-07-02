import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../config';
import { WebSocketConnectionRepository } from './WebSocketConnectionRepository';

const mockNetwork = Network.Mainnet;
const mockWebSocketUrl = 'ws://localhost:8080';
const mockConnectionId = 'some-connection-id';

describe('WebSocketConnectionRepository', () => {
  let repository: WebSocketConnectionRepository;
  let mockConfigProvider: ConfigProvider;

  beforeEach(() => {
    mockConfigProvider = {
      getNetworkBy: jest.fn().mockReturnValue({
        caip2Id: mockNetwork,
        webSocketUrl: mockWebSocketUrl,
      }),
    } as unknown as ConfigProvider;

    repository = new WebSocketConnectionRepository(mockConfigProvider);

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;
  });

  describe('getAll', () => {
    it('returns empty array when there are no connections', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connections = await repository.getAll();

      expect(connections).toStrictEqual([]);
    });

    it('returns all connections opened in the extension', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: mockConnectionId, url: mockWebSocketUrl }]);

      const connections = await repository.getAll();
      expect(connections).toStrictEqual([
        { id: mockConnectionId, url: mockWebSocketUrl, network: mockNetwork },
      ]);
    });
  });

  describe('getById', () => {
    it('returns null when the connection does not exist', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connection = await repository.getById('1');

      expect(connection).toBeNull();
    });

    it('returns the connection when it exists', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: mockConnectionId, url: mockWebSocketUrl }]);

      const connection = await repository.getById(mockConnectionId);

      expect(connection).toStrictEqual({
        id: mockConnectionId,
        url: mockWebSocketUrl,
        network: mockNetwork,
      });
    });
  });

  describe('findByUrl', () => {
    it('returns null when the connection does not exist', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connection = await repository.findByNetwork(mockNetwork);

      expect(connection).toBeNull();
    });

    it('returns the connection when it exists', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: mockConnectionId, url: mockWebSocketUrl }]);

      const connection = await repository.findByNetwork(mockNetwork);

      expect(connection).toStrictEqual({
        id: mockConnectionId,
        url: mockWebSocketUrl,
        network: mockNetwork,
      });
    });
  });

  describe('save', () => {
    it('saves the connection', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue(mockConnectionId);

      const connection = await repository.save({
        network: mockNetwork,
        url: mockWebSocketUrl,
        protocols: [],
      });

      expect(connection).toStrictEqual({
        id: mockConnectionId,
        network: mockNetwork,
        url: mockWebSocketUrl,
        protocols: [],
      });
    });
  });

  describe('delete', () => {
    it('deletes the connection', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue(null);

      await repository.delete(mockConnectionId);

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_closeWebSocket',
        params: { id: mockConnectionId },
      });
    });
  });
});
