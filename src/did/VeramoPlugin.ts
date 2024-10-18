import { createAgent, IIdentifier } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { CredentialIssuer, W3cMessageHandler } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { PublicBlockchainDIDProvider } from './PublicBlockchainDIDProvider';

type VeramoPluginConfig = {
  secretKey: string;
  didProvider: 'ethereum' | 'rest';
  ethereumConfig?: {
    infuraProjectId: string;
    network: 'mainnet' | 'goerli' | 'sepolia';
  };
  restConfig?: {
    publicBlockchainApiUrl: string;
  };
};

export class VeramoPlugin {
  private agent: any;
  private didProvider: string;

  constructor(config: VeramoPluginConfig) {
    const secretKey = config.secretKey;
    this.didProvider = config.didProvider;

    const didProviders: Record<string, any> = {};

    if (config.didProvider === 'ethereum') {
      if (!config.ethereumConfig) {
        throw new Error('Ethereum configuration is required when using Ethereum DID provider');
      }
      didProviders['did:ethr'] = new EthrDIDProvider({
        defaultKms: 'local',
        network: config.ethereumConfig.network,
        rpcUrl: `https://${config.ethereumConfig.network}.infura.io/v3/${config.ethereumConfig.infuraProjectId}`,
      });
    } else if (config.didProvider === 'rest') {
      if (!config.restConfig) {
        throw new Error('REST API configuration is required when using REST DID provider');
      }
      didProviders['did:public'] = new PublicBlockchainDIDProvider({
        apiBaseUrl: config.restConfig.publicBlockchainApiUrl,
      });
    }

    this.agent = createAgent({
      plugins: [
        new KeyManager({
          store: new KeyManagementSystem(new SecretBox(secretKey)),
          kms: {
            local: new KeyManagementSystem(new SecretBox(secretKey)),
          },
        }),
        new DIDManager({
          store: new KeyManagementSystem(new SecretBox(secretKey)),
          defaultProvider: config.didProvider === 'ethereum' ? 'did:ethr' : 'did:public',
          providers: didProviders,
        }),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...ethrDidResolver({ infuraProjectId: config.ethereumConfig?.infuraProjectId }),
          }),
        }),
        new CredentialIssuer(),
        new W3cMessageHandler(),
      ],
    });
  }

  async createDID(options?: { isOrganization?: boolean }): Promise<IIdentifier> {
    const provider = this.didProvider === 'ethereum' ? 'did:ethr' : 'did:public';
    return await this.agent.didManagerCreate({ provider, options });
  }

  async issueVC(issuerDID: string, subjectDID: string, claims: any): Promise<any> {
    const credential = await this.agent.createVerifiableCredential({
      credential: {
        issuer: { id: issuerDID },
        credentialSubject: {
          id: subjectDID,
          ...claims,
        },
      },
      proofFormat: 'jwt',
    });
    return credential;
  }

  async verifyVC(vc: any): Promise<boolean> {
    const result = await this.agent.verifyCredential({ credential: vc });
    return result.verified;
  }
}
