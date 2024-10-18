import Gun from 'gun';
import { Libp2p } from 'libp2p';
import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';

export class P2PNode {
  private gun: Gun | null = null;
  private libp2p: Libp2p | null = null;
  private accessControl: AccessControl;
  private dataStore: DataStore;

  constructor(accessControl: AccessControl, dataStore: DataStore, config: { useGun: boolean }) {
    this.accessControl = accessControl;
    this.dataStore = dataStore;

    if (config.useGun) {
      this.gun = Gun();
    } else {
      // Initialize libp2p here
      // this.libp2p = ...
    }
  }

  async start(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.start();
    }
    console.log('P2P node started');
  }

  async stop(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.stop();
    }
    console.log('P2P node stopped');
  }

  async sendData(peerId: string, dataKey: string, data: any): Promise<void> {
    if (await this.accessControl.hasAccess(peerId, dataKey)) {
      if (this.gun) {
        this.gun.get(dataKey).put(data);
      } else if (this.libp2p) {
        // Implement libp2p data sending logic
      }
    } else {
      throw new Error('Access denied');
    }
  }

  async receiveData(dataKey: string): Promise<any> {
    if (this.gun) {
      return new Promise((resolve) => {
        this.gun!.get(dataKey).once((data) => {
          resolve(data);
        });
      });
    } else if (this.libp2p) {
      // Implement libp2p data receiving logic
    }
    throw new Error('No P2P implementation available');
  }
}
