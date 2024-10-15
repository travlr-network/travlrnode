import express from 'express';
import { DataStore } from '../data/DataStore';
import { AccessControl } from '../data/AccessControl';

export class PublicBlockchainApi {
  private app: express.Application;
  private dataStore: DataStore;
  private accessControl: AccessControl;

  constructor() {
    this.app = express();
    this.dataStore = new DataStore();
    this.accessControl = new AccessControl();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.post('/register-node', (req, res) => {
      const { did, isOrganization } = req.body;
      if (isOrganization) {
        this.accessControl.addOrganization(did);
      } else {
        this.accessControl.addIndividual(did);
      }
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.post('/grant-access', (req, res) => {
      const { granterDID, granteeDID, dataKey, expirationTime } = req.body;
      this.accessControl.grantAccess(granterDID, granteeDID, dataKey, expirationTime);
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.post('/revoke-access', (req, res) => {
      const { revokerDID, granteeDID, dataKey } = req.body;
      this.accessControl.revokeAccess(revokerDID, granteeDID, dataKey);
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.post('/add-delegation', (req, res) => {
      const { fromDID, toDID, dataKey } = req.body;
      this.accessControl.addDelegation(fromDID, toDID, dataKey);
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.post('/remove-delegation', (req, res) => {
      const { fromDID, toDID, dataKey } = req.body;
      this.accessControl.removeDelegation(fromDID, toDID, dataKey);
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.post('/request-data-forwarding', (req, res) => {
      const { requesterDID, targetDID, dataKey } = req.body;
      // In a real implementation, this would trigger a data forwarding request
      res.json({ transactionId: `mock_tx_${Date.now()}` });
    });

    this.app.get('/check-access', (req, res) => {
      const { did, dataKey } = req.query;
      const hasAccess = this.accessControl.hasAccess(did as string, dataKey as string);
      res.json({ hasAccess });
    });

    this.app.get('/check-delegation', (req, res) => {
      const { fromDID, toDID, dataKey } = req.query;
      const hasDelegation = this.accessControl.canDelegate(fromDID as string, toDID as string, dataKey as string);
      res.json({ hasDelegation });
    });
  }

  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`Public Blockchain API (for testing) is running on port ${port}`);
    });
  }
}