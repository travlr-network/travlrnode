export class DataStore {
    private store: Map<string, any[]> = new Map();
  
    addData(key: string, value: any): void {
      if (!this.store.has(key)) {
        this.store.set(key, []);
      }
      this.store.get(key)!.push({
        value,
        timestamp: Date.now(),
        version: this.store.get(key)!.length
      });
    }
  
    getLatestData(key: string): any | null {
      const versions = this.store.get(key);
      return versions ? versions[versions.length - 1] : null;
    }
  
    getSnapshot(key: string, version: number): any | null {
      const versions = this.store.get(key);
      return versions ? versions.find(v => v.version === version) : null;
    }
  }