export const SOL_SYMBOL = 'SOL';

/**
 * Solana CAIP-2 Networks
 * @see https://namespaces.chainagnostic.org/solana/caip2
 */
export enum SolanaCaip2Networks {
  Mainnet = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  Devnet = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  Testnet = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
}

export enum SolanaCaip19Tokens {
  SOL = 'slip44:501',
}

export enum SolanaSubmitRequestMethods {
  SendSolana = 'sendSolana',
}

export enum SolanaInternalRpcMethods {
  StartSendSolanaFlow = 'startSendSolanaFlow',
}
