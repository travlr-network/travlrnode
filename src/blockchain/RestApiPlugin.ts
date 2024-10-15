import { BlockchainPlugin } from './BlockchainPlugin';
import axios, { AxiosInstance } from 'axios';

export class RestApiPlugin implements BlockchainPlugin {
  private api: AxiosInstance;

  constructor(config: { baseUrl: string }) {
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async connect(): Promise<void> {
    // No connection needed for REST API
  }

  async disconnect(): Promise<void> {
    // No disconnection needed for REST API
  }

  async registerNode(did: string, isOrganization: boolean): Promise<string> {
    try {
      const response = await this.api.post('/register-node', { did, isOrganization });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to register node: ${error}`);
    }
  }

  async grantAccess(granterDID: string, granteeDID: string, dataKey: string, expirationTime: number): Promise<string> {
    try {
      const response = await this.api.post('/grant-access', { granterDID, granteeDID, dataKey, expirationTime });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to grant access: ${error}`);
    }
  }

  async revokeAccess(revokerDID: string, granteeDID: string, dataKey: string): Promise<string> {
    try {
      const response = await this.api.post('/revoke-access', { revokerDID, granteeDID, dataKey });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to revoke access: ${error}`);
    }
  }

  async addDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string> {
    try {
      const response = await this.api.post('/add-delegation', { fromDID, toDID, dataKey });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to add delegation: ${error}`);
    }
  }

  async removeDelegation(fromDID: string, toDID: string, dataKey: string): Promise<string> {
    try {
      const response = await this.api.post('/remove-delegation', { fromDID, toDID, dataKey });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to remove delegation: ${error}`);
    }
  }

  async requestDataForwarding(requesterDID: string, targetDID: string, dataKey: string): Promise<string> {
    try {
      const response = await this.api.post('/request-data-forwarding', { requesterDID, targetDID, dataKey });
      return response.data.transactionId;
    } catch (error) {
      throw new Error(`Failed to request data forwarding: ${error}`);
    }
  }

  async checkAccess(did: string, dataKey: string): Promise<boolean> {
    try {
      const response = await this.api.get('/check-access', { params: { did, dataKey } });
      return response.data.hasAccess;
    } catch (error) {
      throw new Error(`Failed to check access: ${error}`);
    }
  }

  async checkDelegation(fromDID: string, toDID: string, dataKey: string): Promise<boolean> {
    try {
      const response = await this.api.get('/check-delegation', { params: { fromDID, toDID, dataKey } });
      return response.data.hasDelegation;
    } catch (error) {
      throw new Error(`Failed to check delegation: ${error}`);
    }
  }
}