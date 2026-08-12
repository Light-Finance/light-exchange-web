// Browser stand-in for @react-native-async-storage/async-storage.
// mobx-persist-store only needs getItem/setItem/removeItem, and it awaits them,
// so the synchronous localStorage calls are simply wrapped in promises.
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },
};

export default Storage;
