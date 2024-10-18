import { DataStorePlugin } from './DataStorePlugin';
import { VeramoPlugin } from '../did/VeramoPlugin';

export default class VerifiableCredentialStore {
  private dataStore: DataStorePlugin;
  private veramo: VeramoPlugin;

  constructor(dataStore: DataStorePlugin, veramo: VeramoPlugin) {
    this.dataStore = dataStore;
    this.veramo = veramo;
  }

  async generateVC(issuerDID: string, subjectDID: string, claims: any): Promise<any> {
    const vc = await this.veramo.issueVC(issuerDID, subjectDID, claims);
    await this.storeVC(vc);
    return vc;
  }

  async storeVC(vc: any): Promise<void> {
    const vcId = vc.id || `vc_${Date.now()}`;
    await this.dataStore.setData(`vc:${vcId}`, vc);
  }

  async getVC(vcId: string): Promise<any> {
    return await this.dataStore.getData(`vc:${vcId}`);
  }

  async listVCs(): Promise<string[]> {
    const allKeys = await this.dataStore.getAllKeys();
    return allKeys.filter(key => key.startsWith('vc:'));
  }

  async verifyVC(vc: any): Promise<boolean> {
    return await this.veramo.verifyVC(vc);
  }
}
