import express from 'express';
import { BlockchainPlugin } from '../blockchain/BlockchainPlugin';
import { P2PNodePlugin } from '../p2p/P2PNodePlugin';
import { AccessControl } from '../data/AccessControl';
import { DataStorePlugin } from '../data/DataStorePlugin';
import { VeramoPlugin } from '../did/VeramoPlugin';

export class RestApi {
  private app: express.Application;
  private blockchain: BlockchainPlugin;
  private p2pNode: P2PNodePlugin;
  private accessControl: AccessControl;
  private dataStore: DataStorePlugin;
  private veramo: VeramoPlugin;

  constructor(blockchain: BlockchainPlugin, p2pNode: P2PNodePlugin, accessControl: AccessControl, dataStore: DataStorePlugin, veramo: VeramoPlugin) {
    this.app = express();
    this.blockchain = blockchain;
    this.p2pNode = p2pNode;
    this.accessControl = accessControl;
    this.dataStore = dataStore;
    this.veramo = veramo;
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

    // DID creation route
    this.app.post('/did/create', async (req, res) => {
      try {
        const identifier = await this.veramo.createDID();
        res.json({ did: identifier.did });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create DID' });
      }
    });

    // VC issuance route
    this.app.post('/vc/issue', async (req, res) => {
      const { issuerDID, subjectDID, claims } = req.body;
      try {
        const vc = await this.veramo.issueVC(issuerDID, subjectDID, claims);
        res.json({ vc });
      } catch (error) {
        res.status(500).json({ error: 'Failed to issue VC' });
      }
    });

    // VC verification route
    this.app.post('/vc/verify', async (req, res) => {
      const { vc } = req.body;
      try {
        const isValid = await this.veramo.verifyVC(vc);
        res.json({ isValid });
      } catch (error) {
        res.status(500).json({ error: 'Failed to verify VC' });
      }
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`REST API server is running on port ${port}`);
    });
  }
}
