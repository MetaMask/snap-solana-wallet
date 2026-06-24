import { expect } from '@jest/globals';
import {
  resolveDomain,
  getPrimaryDomain,
} from '@solana-name-service/sns-sdk-kit';
import type { Address } from '@solana/kit';

import { Network } from '../../constants/solana';
import type { SolanaConnection } from '../connection/SolanaConnection';
import { mockLogger } from '../mocks/logger';
import { NameResolutionService } from './NameResolutionService';

jest.mock('@solana-name-service/sns-sdk-kit');

describe('NameResolutionService', () => {
  let nameResolutionService: NameResolutionService;
  let mockConnection: jest.Mocked<SolanaConnection>;
  let mockRpc: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock connection
    mockConnection = {
      getRpc: jest.fn().mockReturnValue(mockRpc),
    } as unknown as jest.Mocked<SolanaConnection>;

    // Create service instance
    nameResolutionService = new NameResolutionService(
      mockConnection,
      mockLogger,
    );
  });

  describe('resolveDomain', () => {
    const mockDomain = 'example.sol';
    const mockAddress = '11111111111111111111111111111111' as Address;
    const mockNetwork = Network.Mainnet;

    beforeEach(() => {
      jest.mocked(resolveDomain).mockResolvedValue(mockAddress);
    });

    it('resolves a domain to an address successfully', async () => {
      const result = await nameResolutionService.resolveDomain(
        mockNetwork,
        mockDomain,
      );

      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(resolveDomain).toHaveBeenCalledWith(mockRpc, mockDomain);
      expect(result).toBe(mockAddress);
    });

    it('calls getRpc with the correct network', async () => {
      await nameResolutionService.resolveDomain(mockNetwork, mockDomain);

      expect(mockConnection.getRpc).toHaveBeenCalledTimes(1);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
    });

    it('calls resolveDomain with the correct parameters', async () => {
      await nameResolutionService.resolveDomain(mockNetwork, mockDomain);

      expect(resolveDomain).toHaveBeenCalledTimes(1);
      expect(resolveDomain).toHaveBeenCalledWith(mockRpc, mockDomain);
    });

    it('works with different networks', async () => {
      const devnetNetwork = Network.Devnet;

      await nameResolutionService.resolveDomain(devnetNetwork, mockDomain);

      expect(mockConnection.getRpc).toHaveBeenCalledWith(devnetNetwork);
    });

    it('propagates errors from resolveDomain', async () => {
      const error = new Error('Domain resolution failed');
      jest.mocked(resolveDomain).mockRejectedValue(error);

      await expect(
        nameResolutionService.resolveDomain(mockNetwork, mockDomain),
      ).rejects.toThrow('Domain resolution failed');
    });

    it('works with different domain formats', async () => {
      const domains = ['test.sol', 'another.domain', 'sub.domain.test'];

      for (const domain of domains) {
        await nameResolutionService.resolveDomain(mockNetwork, domain);
        expect(resolveDomain).toHaveBeenCalledWith(mockRpc, domain);
      }
    });
  });

  describe('resolveAddress', () => {
    const mockAddress = '11111111111111111111111111111111';
    const mockResolvedAddress = '22222222222222222222222222222222';
    const mockDomain = 'example';
    const mockNetwork = Network.Mainnet;

    it('resolves an address to a domain successfully', async () => {
      jest.mocked(getPrimaryDomain).mockResolvedValue({
        domainAddress: mockDomain as Address,
        domainName: mockDomain,
        stale: false,
      });

      const result = await nameResolutionService.resolveAddress(
        mockNetwork,
        mockAddress,
      );

      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
      expect(getPrimaryDomain).toHaveBeenCalledWith(mockRpc, mockAddress);
      expect(result).toBe(`${mockDomain}.sol`);
    });

    it('calls getRpc with the correct network', async () => {
      await nameResolutionService.resolveAddress(mockNetwork, mockAddress);

      expect(mockConnection.getRpc).toHaveBeenCalledTimes(1);
      expect(mockConnection.getRpc).toHaveBeenCalledWith(mockNetwork);
    });

    it('calls getPrimaryDomain with the correct parameters', async () => {
      await nameResolutionService.resolveAddress(mockNetwork, mockAddress);

      expect(getPrimaryDomain).toHaveBeenCalledTimes(1);
      expect(getPrimaryDomain).toHaveBeenCalledWith(mockRpc, mockAddress);
    });

    it('works with different networks', async () => {
      const devnetNetwork = Network.Devnet;

      await nameResolutionService.resolveAddress(devnetNetwork, mockAddress);

      expect(mockConnection.getRpc).toHaveBeenCalledWith(devnetNetwork);
    });

    it('returns null if the primary domain resolution fails', async () => {
      jest.mocked(getPrimaryDomain).mockRejectedValue(new Error('Error'));

      expect(
        await nameResolutionService.resolveAddress(mockNetwork, mockAddress),
      ).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('handles both resolveDomain and resolveAddress in sequence', async () => {
      const mockDomain = 'example';
      const mockAddress = '11111111111111111111111111111111' as Address;
      const mockNetwork = Network.Mainnet;

      // Setup mocks
      jest.mocked(resolveDomain).mockResolvedValue(mockAddress);
      jest.mocked(getPrimaryDomain).mockResolvedValue({
        domainAddress: mockDomain as Address,
        domainName: mockDomain,
        stale: false,
      });

      // Test resolveDomain
      const resolvedAddress = await nameResolutionService.resolveDomain(
        mockNetwork,
        mockDomain,
      );
      expect(resolvedAddress).toBe(mockAddress);

      // Test resolveAddress
      const resolvedDomain = await nameResolutionService.resolveAddress(
        mockNetwork,
        mockAddress,
      );
      expect(resolvedDomain).toBe(`${mockDomain}.sol`);
    });

    it('works with all network types', async () => {
      const networks = [
        Network.Mainnet,
        Network.Devnet,
        Network.Testnet,
        Network.Localnet,
      ];
      const mockDomain = 'test';
      const mockAddress = '11111111111111111111111111111111' as Address;

      jest.mocked(resolveDomain).mockResolvedValue(mockAddress);
      jest.mocked(getPrimaryDomain).mockResolvedValue({
        domainAddress: mockDomain as Address,
        domainName: mockDomain,
        stale: false,
      });

      for (const network of networks) {
        // Test resolveDomain
        const resolvedAddress = await nameResolutionService.resolveDomain(
          network,
          mockDomain,
        );
        expect(resolvedAddress).toBe(mockAddress);

        // Test resolveAddress
        const resolvedDomain = await nameResolutionService.resolveAddress(
          network,
          mockAddress,
        );
        expect(resolvedDomain).toBe(`${mockDomain}.sol`);
      }
    });
  });
});
