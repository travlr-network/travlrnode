import { DIDResolutionResult, DIDResolver, ParsedDID } from 'did-resolver';
import axios from 'axios';

export class PublicBlockchainDIDResolver implements DIDResolver {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async resolve(
    didUrl: string,
    parsed: ParsedDID
  ): Promise<DIDResolutionResult> {
    if (parsed.method !== 'public') {
      return {
        didResolutionMetadata: { error: 'unsupportedDidMethod' },
        didDocument: null,
        didDocumentMetadata: {}
      };
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/resolve-did/${parsed.id}`);
      const didDocument = response.data;

      return {
        didResolutionMetadata: { contentType: 'application/did+ld+json' },
        didDocument,
        didDocumentMetadata: {}
      };
    } catch (error) {
      console.error('Error resolving DID:', error);
      return {
        didResolutionMetadata: { error: 'notFound' },
        didDocument: null,
        didDocumentMetadata: {}
      };
    }
  }
}
