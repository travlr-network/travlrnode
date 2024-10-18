import express from 'express';
import { BlockchainPlugin } from '../blockchain/BlockchainPlugin';
import { P2PNodePlugin } from '../p2p/P2PNodePlugin';
import { AccessControl } from '../data/AccessControl';
import { DataStore } from '../data/DataStore';
import VerifiableCredentialStore from '../data/VerifiableCredentialStore';
import { VeramoPlugin } from '../did/VeramoPlugin';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';
import specs from './swagger';

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
    this.vcStore = new VerifiableCredentialStore(dataStore, veramo);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /p2p/id:
     *   get:
     *     summary: Get the peer ID
     *     tags: [P2P]
     *     responses:
     *       200:
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 peerId:
     *                   type: string
     */
    this.app.get('/p2p/id', (req, res) => {
      res.json({ peerId: this.p2pNode.getPeerId() });
    });

    /**
     * @swagger
     * /p2p/multiaddrs:
     *   get:
     *     summary: Get the multiaddresses
     *     tags: [P2P]
     *     responses:
     *       200:
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 multiaddrs:
     *                   type: array
     *                   items:
     *                     type: string
     */
    this.app.get('/p2p/multiaddrs', (req, res) => {
      res.json({ multiaddrs: this.p2pNode.getMultiaddrs() });
    });

    /**
     * @swagger
     * /p2p/connect:
     *   post:
     *     summary: Connect to a peer
     *     tags: [P2P]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               multiaddr:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful connection
     *       500:
     *         description: Connection failed
     */
    this.app.post('/p2p/connect', async (req, res) => {
      const { multiaddr } = req.body;
      try {
        await this.p2pNode.connectToPeer(multiaddr);
        res.json({ success: true, message: `Connected to ${multiaddr}` });
      } catch (error) {
        res.status(500).json({ success: false, message: `Failed to connect to ${multiaddr}` });
      }
    });

    /**
     * @swagger
     * /p2p/request-data:
     *   post:
     *     summary: Request data from a peer
     *     tags: [P2P]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               dataKey:
     *                 type: string
     *               requesterDID:
     *                 type: string
     *     responses:
     *       200:
     *         description: Data request sent successfully
     *       500:
     *         description: Failed to send data request
     */
    this.app.post('/p2p/request-data', async (req, res) => {
      const { dataKey, requesterDID } = req.body;
      try {
        await this.p2pNode.requestData(dataKey, requesterDID);
        res.json({ success: true, message: `Data request sent for ${dataKey}` });
      } catch (error) {
        res.status(500).json({ success: false, message: `Failed to request data for ${dataKey}` });
      }
    });

    /**
     * @swagger
     * /did/create:
     *   post:
     *     summary: Create a new DID
     *     tags: [DID]
     *     responses:
     *       200:
     *         description: DID created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 did:
     *                   type: string
     *       500:
     *         description: Failed to create DID
     */
    this.app.post('/did/create', async (req, res) => {
      try {
        const identifier = await this.veramo.createDID();
        res.json({ did: identifier.did });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create DID' });
      }
    });

    /**
     * @swagger
     * /vc/issue:
     *   post:
     *     summary: Issue a Verifiable Credential
     *     tags: [Verifiable Credentials]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               issuerDID:
     *                 type: string
     *               subjectDID:
     *                 type: string
     *               claims:
     *                 type: object
     *     responses:
     *       200:
     *         description: Verifiable Credential issued successfully
     *       500:
     *         description: Failed to issue Verifiable Credential
     */
    this.app.post('/vc/issue', async (req, res) => {
      const { issuerDID, subjectDID, claims } = req.body;
      try {
        const vc = await this.veramo.issueVC(issuerDID, subjectDID, claims);
        res.json({ vc });
      } catch (error) {
        res.status(500).json({ error: 'Failed to issue VC' });
      }
    });

    /**
     * @swagger
     * /vc/verify:
     *   post:
     *     summary: Verify a Verifiable Credential
     *     tags: [Verifiable Credentials]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               vc:
     *                 type: object
     *     responses:
     *       200:
     *         description: Verifiable Credential verification result
     *       500:
     *         description: Failed to verify Verifiable Credential
     */
    this.app.post('/vc/verify', async (req, res) => {
      const { vc } = req.body;
      try {
        const isValid = await this.veramo.verifyVC(vc);
        res.json({ isValid });
      } catch (error) {
        res.status(500).json({ error: 'Failed to verify VC' });
      }
    });

    /**
     * @swagger
     * /vc/generate:
     *   post:
     *     summary: Generate a Verifiable Credential
     *     tags: [Verifiable Credentials]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               issuerDID:
     *                 type: string
     *               subjectDID:
     *                 type: string
     *               claims:
     *                 type: object
     *     responses:
     *       200:
     *         description: Verifiable Credential generated successfully
     *       500:
     *         description: Failed to generate Verifiable Credential
     */
    this.app.post('/vc/generate', async (req, res) => {
      const { issuerDID, subjectDID, claims } = req.body;
      try {
        const vc = await this.vcStore.generateVC(issuerDID, subjectDID, claims);
        res.json({ vc });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate VC' });
      }
    });

    /**
     * @swagger
     * /vc/{id}:
     *   get:
     *     summary: Get a Verifiable Credential by ID
     *     tags: [Verifiable Credentials]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Verifiable Credential retrieved successfully
     *       404:
     *         description: Verifiable Credential not found
     *       500:
     *         description: Failed to retrieve Verifiable Credential
     */
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

    /**
     * @swagger
     * /vc/list:
     *   get:
     *     summary: List all Verifiable Credentials
     *     tags: [Verifiable Credentials]
     *     responses:
     *       200:
     *         description: List of Verifiable Credentials
     *       500:
     *         description: Failed to list Verifiable Credentials
     */
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

    /**
     * @swagger
     * /dataset:
     *   post:
     *     summary: Store a dataset
     *     tags: [Dataset]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               datasetId:
     *                 type: string
     *               data:
     *                 type: object
     *     responses:
     *       200:
     *         description: Dataset stored successfully
     *       500:
     *         description: Failed to store dataset
     */
    this.app.post('/dataset', async (req, res) => {
      const { datasetId, data } = req.body;
      try {
        await this.dataStore.storeDataset(datasetId, data);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to store dataset' });
      }
    });

    /**
     * @swagger
     * /dataset/{id}:
     *   get:
     *     summary: Get a dataset by ID
     *     tags: [Dataset]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Dataset retrieved successfully
     *       404:
     *         description: Dataset not found
     *       500:
     *         description: Failed to retrieve dataset
     */
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

    /**
     * @swagger
     * /dataset/list:
     *   get:
     *     summary: List all datasets
     *     tags: [Dataset]
     *     responses:
     *       200:
     *         description: List of datasets
     *       500:
     *         description: Failed to list datasets
     */
    this.app.get('/dataset/list', async (req, res) => {
      try {
        const datasetList = await this.dataStore.listDatasets();
        res.json({ datasetList });
      } catch (error) {
        res.status(500).json({ error: 'Failed to list datasets' });
      }
    });

    /**
     * @swagger
     * /dataset/{id}:
     *   delete:
     *     summary: Delete a dataset by ID
     *     tags: [Dataset]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Dataset deleted successfully
     *       500:
     *         description: Failed to delete dataset
     */
    this.app.delete('/dataset/:id', async (req, res) => {
      const { id } = req.params;
      try {
        await this.dataStore.deleteDataset(id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete dataset' });
      }
    });

    // Serve Swagger UI
    this.app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

    // Serve ReDoc
    this.app.get(
      '/redocs',
      redoc({
        title: 'TravlrNode API Documentation',
        specUrl: '/swagger.json',
      })
    );

    // Serve Swagger JSON
    this.app.get('/swagger.json', (req, res) => {
      res.json(specs);
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`REST API server is running on port ${port}`);
    });
  }
}
