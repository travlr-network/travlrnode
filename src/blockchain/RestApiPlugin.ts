import { BlockchainPlugin } from './BlockchainPlugin';
import axios from 'axios';

export class RestApiPlugin implements BlockchainPlugin {
  private baseUrl: string;

  constructor(config: { baseUrl: string }) {
    this.baseUrl = config.baseUrl;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async registerNode(did: string, isOrganization: boolean): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/register-node`, { did, isOrganization });
    return response.data.transactionId;
  }

  // Implement other methods similarly
  // ...

  async checkAccess(did: string, dataKey: string): Promise<boolean> {
    const response = await axios.get(`${this.baseUrl}/check-access`, { params: { did, dataKey } });
    return response.data.hasAccess;
  }

  async checkDelegation(fromDID: string, toDID: string, dataKey: string): Promise<boolean> {
    const response = await axios.get(`${this.baseUrl}/check-delegation`, { params: { fromDID, toDID, dataKey } });
    return response.data.hasDelegation;
  }
}