import Libp2p from 'libp2p';
import TCP from 'libp2p-tcp';
import WebRTCStar from 'libp2p-webrtc-star';
import Websockets from 'libp2p-websockets';
import { NOISE } from '@chainsafe/libp2p-noise';
import MPLEX from '@chainsafe/libp2p-mplex';
import Bootstrap from 'libp2p-bootstrap';
import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery';
import GossipSub from 'libp2p-gossipsub';
import { createLibp2p } from 'libp2p';
import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';
import { Multiaddr } from 'multiaddr';

export class P2PNode {
  private node: Libp2p | null = null;
  private dataStore: DataStore;
  private accessControl: AccessControl;

  constructor(dataStore: DataStore, accessControl: AccessControl) {
    this.dataStore = dataStore;
    this.accessControl = accessControl;
  }

  async start(isMobile: boolean = false): Promise<void> {
    const transports = isMobile ? [WebRTCStar, Websockets] : [TCP, WebRTCStar, Websockets];

    this.node = await createLibp2p({
      addresses: {
        listen: isMobile ? ['/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star'] : ['/ip4/0.0.0.0/tcp/0']
      },
      modules: {
        transport: transports,
        connEncryption: [NOISE],
        streamMuxer: [MPLEX],
        pubsub: GossipSub,
        peerDiscovery: [Bootstrap, PubsubPeerDiscovery]
      },
      config: {
        peerDiscovery: {
          bootstrap: {
            list: ['/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN']
          },
          pubsub: {
            enabled: true,
            interval: 1000,
            emitSelf: true
          }
        },
        pubsub: {
          enabled: true,
          emitSelf: true
        }
      }
    });

    await this.node.start();
    console.log('P2P node started with ID:', this.node.peerId.toString());

    this.setupMessageHandlers();
  }

  async stop(): Promise<void> {
    if (this.node) {
      await this.node.stop();
      console.log('P2P node stopped');
    }
  }

  private setupMessageHandlers(): void {
    if (!this.node) return;

    this.node.pubsub.subscribe('data-request');
    this.node.pubsub.subscribe('data-response');

    this.node.pubsub.on('data-request', this.handleDataRequest.bind(this));
    this.node.pubsub.on('data-response', this.handleDataResponse.bind(this));
  }

  private async handleDataRequest(message: any): Promise<void> {
    const { requesterDID, dataKey } = JSON.parse(message.data.toString());

    if (this.accessControl.hasAccess(requesterDID, dataKey)) {
      const data = this.dataStore.getLatestData(dataKey);
      if (data) {
        await this.node!.pubsub.publish('data-response', Buffer.from(JSON.stringify({ requesterDID, dataKey, data })));
      }
    }
  }

  private handleDataResponse(message: any): void {
    const { requesterDID, dataKey, data } = JSON.parse(message.data.toString());
    console.log(`Received data for ${dataKey} requested by ${requesterDID}`);
    // Handle the received data (e.g., store it or pass it to the application layer)
  }

  async requestData(dataKey: string, requesterDID: string): Promise<void> {
    await this.node!.pubsub.publish('data-request', Buffer.from(JSON.stringify({ requesterDID, dataKey })));
  }

  async connectToPeer(multiaddr: string): Promise<void> {
    const addr = new Multiaddr(multiaddr);
    await this.node!.dial(addr);
    console.log(`Connected to peer: ${multiaddr}`);
  }

  getPeerId(): string {
    return this.node ? this.node.peerId.toString() : '';
  }

  getMultiaddrs(): string[] {
    return this.node ? this.node.multiaddrs.map(ma => ma.toString()) : [];
  }
}