import Gun from 'gun';
import 'gun/sea';
import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';

export class P2PNode {
  private gun: Gun;
  private dataStore: DataStore;
  private accessControl: AccessControl;
  private peers: string[];

  constructor(peers: string[] = []) {
    this.peers = peers;
    this.gun = Gun({ peers: this.peers });
    this.dataStore = new DataStore(this.gun);
    this.accessControl = new AccessControl(this.gun);
  }

  async start(): Promise<void> {
    console.log('P2P node started');
    this.setupDataHandlers();
  }

  async stop(): Promise<void> {
    // Gun doesn't have a built-in stop method, but we can disconnect from peers
    this.peers.forEach(peer => this.gun.bye(peer));
    console.log('P2P node stopped');
  }

  private setupDataHandlers(): void {
    this.gun.on('put', (data: any) => {
      const { key, value, _: { '#': messageId, '>': { [key]: lastUpdate } = {} } } = data;
      this.handleDataUpdate(key, value, messageId, lastUpdate);
    });
  }

  private handleDataUpdate(key: string, value: any, messageId: string, lastUpdate: number): void {
    console.log(`Received data update for ${key}`);
    // Here you can implement access control checks and data storage
    if (this.accessControl.hasAccess(this.gun.user().is.pub, key)) {
      this.dataStore.setData(key, value, lastUpdate);
    }
  }

  async requestData(dataKey: string): Promise<void> {
    const userPubKey = this.gun.user().is.pub;
    if (await this.accessControl.hasAccess(userPubKey, dataKey)) {
      const data = await this.dataStore.getData(dataKey);
      if (data) {
        console.log(`Received data for ${dataKey}`);
        // Handle the received data as needed
      }
    }
  }

  async setData(dataKey: string, data: any): Promise<void> {
    const userPubKey = this.gun.user().is.pub;
    if (await this.accessControl.hasAccess(userPubKey, dataKey)) {
      this.dataStore.setData(dataKey, data);
    }
  }

  async connectToPeer(peerUrl: string): Promise<void> {
    this.gun.opt({ peers: [...this.peers, peerUrl] });
    this.peers.push(peerUrl);
    console.log(`Connected to peer: ${peerUrl}`);
  }

  getPeerId(): string {
    return this.gun.user().is.pub || '';
  }

  getPeers(): string[] {
    return this.peers;
  }

  // User authentication methods
  async createUser(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gun.user().create(username, password, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  async login(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gun.user().auth(username, password, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  logout(): void {
    this.gun.user().leave();
  }
}
