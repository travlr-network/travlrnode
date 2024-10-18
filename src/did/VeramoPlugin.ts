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
import { PublicBlockchainDIDResolver } from './PublicBlockchainDIDResolver';

interface VeramoPluginOptions {
  secretKey: string;
  didProvider: 'ethereum' | 'rest';
  ethereumConfig?: {
    infuraProjectId: string;
    network: 'mainnet' | 'goerli' | 'sepolia';
  };
  restConfig?: {
    publicBlockchainApiUrl: string;
  };
}

export class VeramoPlugin {
  private agent: any;
  private didProvider: string;

  constructor(options: VeramoPluginOptions) {
    const secretKey = options.secretKey;
    this.didProvider = options.didProvider;

    const didProviders: Record<string, any> = {};

    if (options.didProvider === 'ethereum') {
      if (!options.ethereumConfig) {
        throw new Error('Ethereum configuration is required when using Ethereum DID provider');
      }
      didProviders['did:ethr'] = new EthrDIDProvider({
        defaultKms: 'local',
        network: options.ethereumConfig.network,
        rpcUrl: `https://${options.ethereumConfig.network}.infura.io/v3/${options.ethereumConfig.infuraProjectId}`,
      });
    } else if (options.didProvider === 'rest') {
      if (!options.restConfig) {
        throw new Error('REST API configuration is required when using REST DID provider');
      }
      didProviders['did:public'] = new PublicBlockchainDIDProvider({
        apiBaseUrl: options.restConfig.publicBlockchainApiUrl,
      });
    }

    const secretBox = new SecretBox(secretKey);

    const ethrDidResolverConfig = {
      networks: [
        {
          name: process.env.ETHEREUM_NETWORK || 'mainnet',
          rpcUrl: `https://${process.env.ETHEREUM_NETWORK || 'mainnet'}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        },
      ],
    };

    const resolvers: Record<string, DIDResolver> = {
      ...ethrDidResolver(ethrDidResolverConfig),
    };

    if (options.didProvider === 'rest') {
      resolvers['did:public'] = new PublicBlockchainDIDResolver(options.restConfig!.publicBlockchainApiUrl).resolve;
    }

    const resolver = new Resolver(resolvers);

    this.agent = createAgent({
      plugins: [
        new KeyManager({
          store: new KeyManagementSystem(secretBox),
          kms: {
            local: new KeyManagementSystem(secretBox),
          },
        }),
        new DIDManager({
          store: new KeyManagementSystem(secretBox),
          defaultProvider: options.didProvider === 'ethereum' ? 'did:ethr' : 'did:public',
          providers: didProviders,
        }),
        new DIDResolverPlugin({
          resolver,
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
