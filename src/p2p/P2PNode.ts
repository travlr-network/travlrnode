import Libp2p from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webRTCStar } from '@libp2p/webrtc-star';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { createLibp2p } from 'libp2p';
import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';
import { multiaddr } from '@multiformats/multiaddr';

export class P2PNode {
  private node: Libp2p | null = null;
  private dataStore: DataStore;
  private accessControl: AccessControl;

  constructor(dataStore: DataStore, accessControl: AccessControl) {
    this.dataStore = dataStore;
    this.accessControl = accessControl;
  }

  async start(isMobile: boolean = false): Promise<void> {
    const transports = isMobile ? [webRTCStar, webSockets] : [tcp, webRTCStar, webSockets];

    this.node = await createLibp2p({
      addresses: {
        listen: isMobile ? ['/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star'] : ['/ip4/0.0.0.0/tcp/0']
      },
      transports: transports,
      connectionEncryption: [noise()],
      streamMuxers: [yamux()],
      pubsub: gossipsub(),
      peerDiscovery: [
        bootstrap({
          list: ['/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN']
        }),
        pubsubPeerDiscovery({
          interval: 1000,
          emitSelf: true
        })
      ],
      config: {
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

    this.node.pubsub.addEventListener('message', (evt) => {
      if (evt.detail.topic === 'data-request') {
        this.handleDataRequest(evt.detail.data);
      } else if (evt.detail.topic === 'data-response') {
        this.handleDataResponse(evt.detail.data);
      }
    });
  }

  private async handleDataRequest(data: Uint8Array): Promise<void> {
    const { requesterDID, dataKey } = JSON.parse(new TextDecoder().decode(data));

    if (this.accessControl.hasAccess(requesterDID, dataKey)) {
      const data = this.dataStore.getLatestData(dataKey);
      if (data) {
        await this.node!.pubsub.publish('data-response', new TextEncoder().encode(JSON.stringify({ requesterDID, dataKey, data })));
      }
    }
  }

  private handleDataResponse(data: Uint8Array): void {
    const { requesterDID, dataKey, data: responseData } = JSON.parse(new TextDecoder().decode(data));
    console.log(`Received data for ${dataKey} requested by ${requesterDID}`);
    // Handle the received data (e.g., store it or pass it to the application layer)
  }

  async requestData(dataKey: string, requesterDID: string): Promise<void> {
    await this.node!.pubsub.publish('data-request', new TextEncoder().encode(JSON.stringify({ requesterDID, dataKey })));
  }

  async connectToPeer(multiaddrString: string): Promise<void> {
    const addr = multiaddr(multiaddrString);
    await this.node!.dial(addr);
    console.log(`Connected to peer: ${multiaddrString}`);
  }

  getPeerId(): string {
    return this.node ? this.node.peerId.toString() : '';
  }

  getMultiaddrs(): string[] {
    return this.node ? this.node.getMultiaddrs().map(ma => ma.toString()) : [];
  }
}