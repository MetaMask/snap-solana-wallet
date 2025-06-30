import { ConnectionRepository } from './ConnectionRepository';

describe('ConnectionRepository', () => {
  let connectionRepository: ConnectionRepository;

  beforeEach(() => {
    connectionRepository = new ConnectionRepository();

    const snap = {
      request: jest.fn(),
    };
    (globalThis as any).snap = snap;
  });

  describe('getAll', () => {
    it('returns empty array when there are no connections', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connections = await connectionRepository.getAll();

      expect(connections).toStrictEqual([]);
    });

    it('returns all connections opened in the extension', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: '1', url: 'ws://localhost:8080' }]);

      const connections = await connectionRepository.getAll();
      expect(connections).toStrictEqual([
        { id: '1', url: 'ws://localhost:8080' },
      ]);
    });
  });

  describe('getById', () => {
    it('returns null when the connection does not exist', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connection = await connectionRepository.getById('1');

      expect(connection).toBeNull();
    });

    it('returns the connection when it exists', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: '1', url: 'ws://localhost:8080' }]);

      const connection = await connectionRepository.getById('1');

      expect(connection).toStrictEqual({ id: '1', url: 'ws://localhost:8080' });
    });
  });

  describe('findByUrl', () => {
    it('returns null when the connection does not exist', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue([]);

      const connection = await connectionRepository.findByUrl(
        'ws://localhost:8080',
      );

      expect(connection).toBeNull();
    });

    it('returns the connection when it exists', async () => {
      jest
        .spyOn(snap, 'request')
        .mockResolvedValue([{ id: '1', url: 'ws://localhost:8080' }]);

      const connection = await connectionRepository.findByUrl(
        'ws://localhost:8080',
      );

      expect(connection).toStrictEqual({ id: '1', url: 'ws://localhost:8080' });
    });
  });

  describe('save', () => {
    it('saves the connection', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue('1');

      const connectionId = await connectionRepository.save(
        'ws://localhost:8080',
      );

      expect(connectionId).toBe('1');
    });
  });

  describe('delete', () => {
    it('deletes the connection', async () => {
      jest.spyOn(snap, 'request').mockResolvedValue(null);

      await connectionRepository.delete('1');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_closeWebSocket',
        params: { id: '1' },
      });
    });
  });
});
