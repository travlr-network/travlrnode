import { BlockchainPlugin } from '../blockchain/BlockchainPlugin';

export class AccessControl {
    private blockchain: BlockchainPlugin;

    constructor(blockchain: BlockchainPlugin) {
        this.blockchain = blockchain;
    }

    async grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number): Promise<string> {
        return this.blockchain.grantAccess(granterDID, granteeDID, dataKey, expirationTime);
    }

    async revokeAccess(revokerDID: string, granteeDID: string, dataKey: string): Promise<string> {
        return this.blockchain.revokeAccess(revokerDID, granteeDID, dataKey);
    }

    async hasAccess(did: string, dataKey: string): Promise<boolean> {
        return this.blockchain.checkAccess(did, dataKey);
    }

    addOrganization(did: string) {
        // Existing implementation
    }

    addIndividual(did: string) {
        // Add implementation for individual registration
        // For example:
        // this.individuals.add(did);
    }
}
