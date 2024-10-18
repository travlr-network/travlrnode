import { IIdentifier, IKey, IService, IAgentContext, IKeyManager, IDIDManager } from '@veramo/core';
import { AbstractIdentifierProvider } from '@veramo/did-manager';
import axios from 'axios';

export class PublicBlockchainDIDProvider extends AbstractIdentifierProvider {
  private apiBaseUrl: string;

  constructor(options: { apiBaseUrl: string }) {
    super();
    this.apiBaseUrl = options.apiBaseUrl;
  }

  async createIdentifier(
    { kms, options }: { kms?: string; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const key = await context.agent.keyManagerCreate({ kms });
    const did = `did:public:${key.publicKeyHex}`;

    try {
      await axios.post(`${this.apiBaseUrl}/register-node`, {
        did,
        isOrganization: options?.isOrganization || false,
      });
    } catch (error) {
      throw new Error(`Failed to register DID: ${error}`);
    }

    return {
      did,
      controllerKeyId: key.kid,
      keys: [key],
      services: [],
    };
  }

  async deleteIdentifier(identifier: IIdentifier, context: IAgentContext<IKeyManager>): Promise<boolean> {
    // Deletion is not supported in this simple implementation
    return true;
  }

  async addKey(
    { identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<any> {
    // Adding keys is not supported in this simple implementation
    throw new Error('Adding keys is not supported');
  }

  async addService(
    { identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<any> {
    // Adding services is not supported in this simple implementation
    throw new Error('Adding services is not supported');
  }

  async removeKey(
    args: { identifier: IIdentifier; kid: string; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<any> {
    // Removing keys is not supported in this simple implementation
    throw new Error('Removing keys is not supported');
  }

  async removeService(
    args: { identifier: IIdentifier; id: string; options?: any },
    context: IAgentContext<IKeyManager>
  ): Promise<any> {
    // Removing services is not supported in this simple implementation
    throw new Error('Removing services is not supported');
  }
}
