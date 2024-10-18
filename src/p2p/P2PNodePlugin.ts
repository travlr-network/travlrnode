import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';

export interface P2PNodePlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  sendData(peerId: string, dataKey: string, data: any): Promise<void>;
  receiveData(dataKey: string): Promise<any>;
  getPeerId(): string;
  getMultiaddrs(): string[];
  connectToPeer(multiaddr: string): Promise<void>;
  requestData(dataKey: string, requesterDID: string): Promise<void>;
}

export function createP2PNodePlugin(type: string, accessControl: AccessControl, dataStore: DataStore, config: any): P2PNodePlugin {
  switch (type) {
    case 'gun':
      return new GunP2PNodePlugin(accessControl, dataStore, config);
    // Add other P2P implementations here
    default:
      throw new Error(`Unsupported P2P type: ${type}`);
  }
}
