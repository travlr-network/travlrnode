import Gun from 'gun';

export abstract class DataStore {
  abstract setData(key: string, value: any): Promise<void>;
  abstract getData(key: string): Promise<any>;
}

export class FileDataStore extends DataStore {
  // Implement file-based storage
}

export class SQLiteDataStore extends DataStore {
  // Implement SQLite-based storage
}
