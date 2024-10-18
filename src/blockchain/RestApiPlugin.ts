import { BlockchainPlugin } from './BlockchainPlugin';
import axios, { AxiosInstance } from 'axios';

export class RestApiPlugin implements BlockchainPlugin {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor(config: { baseUrl: string }) {
    this.baseUrl = config.baseUrl;
    this.api = axios.create({
      baseURL: this.baseUrl,
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

  async registerNode(): Promise<void> {
    try {
      const url = `${this.baseUrl}/register-node`;
      console.log(`Attempting to register node at: ${url}`);
      const response = await this.api.post('/register-node', {
        // Node registration data
      });
      console.log('Registration response:', response.data);
      // Handle successful registration
    } catch (error) {
      console.error('Full error object:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
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
