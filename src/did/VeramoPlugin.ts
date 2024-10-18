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
import { DIDResolver } from 'did-resolver';
import { MemoryKeyStore } from '@veramo/key-manager';
import { MemoryDIDStore } from '@veramo/did-manager';

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
  private didProvider: 'ethereum' | 'rest';

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
    const privateKeyStore = secretBox;

    const ethrDidResolverConfig = {
      networks: [
        {
          name: options.ethereumConfig?.network || 'mainnet',
          rpcUrl: `https://${options.ethereumConfig?.network || 'mainnet'}.infura.io/v3/${options.ethereumConfig?.infuraProjectId || process.env.INFURA_PROJECT_ID}`,
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

    const kms = new KeyManagementSystem(privateKeyStore);

    const didStore = new MemoryDIDStore()

    this.agent = createAgent({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: kms,
          },
        }),
        new DIDManager({
          store: didStore,
          defaultProvider: options.didProvider === 'ethereum' ? 'did:ethr' : 'did:public',
          providers: didProviders,
        }),
        new DIDResolverPlugin({
          resolver,
        }),
        new CredentialIssuer(),
      ],
    });
  }

  async createDID(options?: { isOrganization?: boolean }): Promise<IIdentifier> {
    const provider = this.didProvider === 'ethereum' ? 'did:ethr' : 'did:public';
    return await this.agent.didManagerCreate({
      provider,
      alias: options?.isOrganization ? 'organization' : 'individual',
      kms: 'local',
      options: {
        // Add any provider-specific options here if needed
      },
      key: {
        type: 'Secp256k1',
        // You may need to add additional key options depending on your requirements
      }
    });
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
