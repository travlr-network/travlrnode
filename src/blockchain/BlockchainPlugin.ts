import { EthereumPlugin } from './EthereumPlugin';
import { SuiPlugin } from './SuiPlugin';
import { RestApiPlugin } from './RestApiPlugin';

export interface BlockchainPlugin {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    registerNode(did: string, isOrganization: boolean): Promise<string>;
    grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number): Promise<string>;
    revokeAccess(revokerDID: string, granteeDID: string, dataKey: string): Promise<string>;
    addDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string>;
    removeDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string>;
    requestDataForwarding(requesterDID: string, targetDID: string, dataKey: string): Promise<string>;
    checkAccess(did: string, dataKey: string): Promise<boolean>;
    checkDelegation(fromDID: string, toDID: string, dataKey: string): Promise<boolean>;
  }
  
  export function createBlockchainPlugin(blockchain: string, config: any): BlockchainPlugin {
    switch (blockchain) {
      case 'ethereum':
        return new EthereumPlugin(config);
      case 'sui':
        return new SuiPlugin(config);
      case 'rest':
        return new RestApiPlugin(config);
      default:
        throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
  }