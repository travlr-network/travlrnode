import express from 'express';
import { BlockchainPlugin } from '../blockchain/BlockchainPlugin';
import { P2PNodePlugin } from '../p2p/P2PNodePlugin';
import { AccessControl } from '../data/AccessControl';
import { DataStore } from '../data/DataStore';
import VerifiableCredentialStore from '../data/VerifiableCredentialStore';
import { VeramoPlugin } from '../did/VeramoPlugin';

export class RestApi {
  private app: express.Application;
  private blockchain: BlockchainPlugin;
  private p2pNode: P2PNodePlugin;
  private accessControl: AccessControl;
  private dataStore: DataStore;
  private vcStore: VerifiableCredentialStore;
  private veramo: VeramoPlugin;

  constructor(
    blockchain: BlockchainPlugin,
    p2pNode: P2PNodePlugin,
    accessControl: AccessControl,
    dataStore: DataStore,
    veramo: VeramoPlugin
  ) {
    this.app = express();
    this.blockchain = blockchain;
    this.p2pNode = p2pNode;
    this.accessControl = accessControl;
    this.dataStore = dataStore;
    this.veramo = veramo;
    this.vcStore = new VerifiableCredentialStore(dataStore.getDataStorePlugin(), veramo);
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

    // VC routes
    this.app.post('/vc/generate', async (req, res) => {
      const { issuerDID, subjectDID, claims } = req.body;
      try {
        const vc = await this.vcStore.generateVC(issuerDID, subjectDID, claims);
        res.json({ vc });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate VC' });
      }
    });

    this.app.get('/vc/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const vc = await this.vcStore.getVC(id);
        if (vc) {
          res.json({ vc });
        } else {
          res.status(404).json({ error: 'VC not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve VC' });
      }
    });

    this.app.get('/vc/list', async (req, res) => {
      try {
        const vcList = await this.vcStore.listVCs();
        res.json({ vcList });
      } catch (error) {
        res.status(500).json({ error: 'Failed to list VCs' });
      }
    });

    this.app.post('/vc/verify', async (req, res) => {
      const { vc } = req.body;
      try {
        const isValid = await this.vcStore.verifyVC(vc);
        res.json({ isValid });
      } catch (error) {
        res.status(500).json({ error: 'Failed to verify VC' });
      }
    });

    // Dataset routes
    this.app.post('/dataset', async (req, res) => {
      const { datasetId, data } = req.body;
      try {
        await this.dataStore.storeDataset(datasetId, data);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to store dataset' });
      }
    });

    this.app.get('/dataset/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const dataset = await this.dataStore.getDataset(id);
        if (dataset) {
          res.json({ dataset });
        } else {
          res.status(404).json({ error: 'Dataset not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve dataset' });
      }
    });

    this.app.get('/dataset/list', async (req, res) => {
      try {
        const datasetList = await this.dataStore.listDatasets();
        res.json({ datasetList });
      } catch (error) {
        res.status(500).json({ error: 'Failed to list datasets' });
      }
    });

    this.app.delete('/dataset/:id', async (req, res) => {
      const { id } = req.params;
      try {
        await this.dataStore.deleteDataset(id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete dataset' });
      }
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`REST API server is running on port ${port}`);
    });
  }
}
