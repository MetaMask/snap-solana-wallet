import BigNumber from 'bignumber.js';

import { lamportsToSol, solToLamports } from './conversion';

describe('Solana conversion utils', () => {
  describe('lamportsToSol', () => {
    it('correctly converts lamports to SOL', () => {
      expect(lamportsToSol(1).toString()).toBe('1e-9');
      expect(lamportsToSol(1).toFixed()).toBe('0.000000001');
      expect(lamportsToSol(1000000000).toString()).toBe('1');
      expect(lamportsToSol(500000000).toString()).toBe('0.5');
      expect(lamportsToSol(0).toString()).toBe('0');
    });

    it('handles string inputs', () => {
      expect(lamportsToSol('1000000000').toString()).toBe('1');
    });

    it('handles BigNumber inputs', () => {
      expect(lamportsToSol(new BigNumber('1000000000')).toString()).toBe('1');
    });

    it('handles bigint inputs', () => {
      expect(lamportsToSol(1000000000n).toString()).toBe('1');
    });
  });

  describe('solToLamports', () => {
    it('correctly converts SOL to lamports', () => {
      expect(solToLamports(1).toString()).toBe('1000000000');
      expect(solToLamports(0.5).toString()).toBe('500000000');
      expect(solToLamports(0).toString()).toBe('0');
    });

    it('handles string inputs', () => {
      expect(solToLamports('1').toString()).toBe('1000000000');
    });

    it('handles BigNumber inputs', () => {
      expect(solToLamports(new BigNumber('1')).toString()).toBe('1000000000');
    });

    it('handles bigint inputs', () => {
      expect(solToLamports(BigInt(1)).toString()).toBe('1000000000');
    });
  });
});
