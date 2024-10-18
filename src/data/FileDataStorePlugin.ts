import fs from 'fs/promises';
import path from 'path';
import { DataStorePlugin } from './DataStorePlugin';

export class FileDataStorePlugin implements DataStorePlugin {
  private dataDir: string;

  constructor(config: { dataDir: string }) {
    this.dataDir = config.dataDir;
  }

  async setData(key: string, value: any): Promise<void> {
    const filePath = path.join(this.dataDir, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(value), 'utf-8');
  }

  async getData(key: string): Promise<any> {
    const filePath = path.join(this.dataDir, `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    const files = await fs.readdir(this.dataDir);
    return files.filter(file => file.endsWith('.json')).map(file => path.parse(file).name);
  }

  async deleteData(key: string): Promise<void> {
    const filePath = path.join(this.dataDir, `${key}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
