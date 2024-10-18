import { DataStorePlugin } from './DataStorePlugin';

export class DataStore {
  private dataStore: DataStorePlugin;

  constructor(dataStore: DataStorePlugin) {
    this.dataStore = dataStore;
  }

  getDataStorePlugin(): DataStorePlugin {
    return this.dataStore;
  }

  async storeDataset(datasetId: string, data: any): Promise<void> {
    await this.dataStore.setData(`dataset:${datasetId}`, data);
  }

  async getDataset(datasetId: string): Promise<any> {
    return await this.dataStore.getData(`dataset:${datasetId}`);
  }

  async listDatasets(): Promise<string[]> {
    const allKeys = await this.dataStore.getAllKeys();
    return allKeys.filter(key => key.startsWith('dataset:'));
  }

  async deleteDataset(datasetId: string): Promise<void> {
    await this.dataStore.deleteData(`dataset:${datasetId}`);
  }
}
