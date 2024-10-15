import express from 'express';
import { BlockchainPlugin } from '../blockchain/BlockchainPlugin';
import { P2PNode } from '../p2p/P2PNode';

export class RestApi {
  private app: express.Application;
  private blockchain: BlockchainPlugin;
  private p2pNode: P2PNode;

  constructor(blockchain: BlockchainPlugin, p2pNode: P2PNode) {
    this.app = express();
    this.blockchain = blockchain;
    this.p2pNode = p2pNode;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    
    // P2P routes
    this.app.get('/p2p/id', (req, res) => {
      res.json({ peerId: this.p2pNode.getPeerId() });
    });

    this.app.get('/p2p/multiaddrs', (req, res) => {
      res.json({ multiaddrs: this.p2pNode.getMultiaddrs() });
    });

    this.app.post('/p2p/connect', async (req, res) => {
      const { multiaddr } = req.body;
      try {
        await this.p2pNode.connectToPeer(multiaddr);
        res.json({ success: true, message: `Connected to ${multiaddr}` });
      } catch (error) {
        res.status(500).json({ success: false, message: `Failed to connect to ${multiaddr}` });
      }
    });

    this.app.post('/p2p/request-data', async (req, res) => {
      const { dataKey, requesterDID } = req.body;
      try {
        await this.p2pNode.requestData(dataKey, requesterDID);
        res.json({ success: true, message: `Data request sent for ${dataKey}` });
      } catch (error) {
        res.status(500).json({ success: false, message: `Failed to request data for ${dataKey}` });
      }
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`REST API server is running on port ${port}`);
    });
  }
}