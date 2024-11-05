import type {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import { SolanaState } from './state';

export class SolanaKeyring implements Keyring {
  readonly #state: SolanaState;

  constructor() {
    this.#state = new SolanaState();
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    // TODO: Implement method, this is a placeholder
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    // TODO: Implement method, this is a placeholder
    return {
      type: 'eip155:eoa',
      id: 'default-id',
      address: 'default-address',
      options: {},
      methods: [],
    };
  }

  async createAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: Record<string, Json>,
  ): Promise<KeyringAccount> {
    // TODO: Implement method, this is a placeholder

    // const lastAddressIndex = await this.#state.get()
    // const account = await SolanaWallet.create({ index: 0 })
    // this.#state.update((state) => {
    // return { wallets: [...state.wallets, account] }
    //})
    // await this.#emitEvent(KeyringEvent.AccountCreated, {
    //   account: keyringAccount,
    //   accountNameSuggestion: this.getKeyringAccountNameSuggestion(options),
    // });

    
    /**
     * Get the derivationPath from request.params
     * Call the  method: 'snap_getBip32Entropy',
     * From there we get the rootNode (Similar to BTC way)
     * await SLIP10Node.fromJSON(rootNode);
     * await node.derive(derivationPath.map((segment) => `slip10:${segment}`));
     * we try to get a valid signing key pair with: const myKeypair = nacl.sign.keyPair.fromSeed(Uint8Array.from(slipNode.privateKeyBytes));
     * Finally encode the publicKey with:     const pubkey = bs58.encode(myKeypair.publicKey);
     */

    // const keyringAccount = this.newKeyringAccount(account, {
    //   scope: options.scope,
    //   index,
    // });



    return {
      type: 'eip155:eoa',
      id: 'new-id',
      address: 'new-address',
      options: {},
      methods: [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateAccount(account: KeyringAccount): Promise<void> {
    // TODO: Implement method, this is a placeholder
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteAccount(id: string): Promise<void> {
    // TODO: Implement method, this is a placeholder
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // TODO: Implement method, this is a placeholder
    return { pending: true };
  }
}
