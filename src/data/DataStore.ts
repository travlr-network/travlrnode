import Gun from 'gun';

export class DataStore {
  private gun: Gun;

  constructor(gun: Gun) {
    this.gun = gun;
  }

  setData(key: string, value: any, timestamp?: number): void {
    this.gun.get(key).put({
      value,
      timestamp: timestamp || Date.now()
    });
  }

  getData(key: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(key).once((data) => {
        resolve(data ? data.value : null);
      });
    });
  }

  getLatestData(key: string): Promise<any> {
    return this.getData(key);
  }

  subscribeToData(key: string, callback: (data: any) => void): void {
    this.gun.get(key).on((data) => {
      if (data) {
        callback(data.value);
      }
    });
  }

  unsubscribeFromData(key: string): void {
    this.gun.get(key).off();
  }
}
