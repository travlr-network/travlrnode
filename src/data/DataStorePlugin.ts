import { FileDataStorePlugin } from "./FileDataStorePlugin";

export interface DataStorePlugin {
  setData(key: string, value: any): Promise<void>;
  getData(key: string): Promise<any>;
  getAllKeys(): Promise<string[]>;
  deleteData(key: string): Promise<void>;
}

export function createDataStorePlugin(type: string, config: any): DataStorePlugin {
  switch (type) {
    case 'file':
      return new FileDataStorePlugin(config);
    // Add other DataStore implementations here
    default:
      throw new Error(`Unsupported DataStore type: ${type}`);
  }
}
