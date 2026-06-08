const DB_NAME = 'ChatbotPWA_DB';
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Topics store
        if (!db.objectStoreNames.contains('topics')) {
          db.createObjectStore('topics', { keyPath: 'id', autoIncrement: true });
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('topicId', 'topicId', { unique: false });
          messageStore.createIndex('parentId', 'parentId', { unique: false });
        }

        // Prompts store
        if (!db.objectStoreNames.contains('prompts')) {
          db.createObjectStore('prompts', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject('IndexedDB error: ' + event.target.errorCode);
      };
    });
  }

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMessagesByTopic(topicId) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('topicId');
      const request = index.getAll(topicId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(message);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearMessagesByTopic(topicId) {
     return new Promise((resolve, reject) => {
        if (!this.db) { reject('DB not initialized'); return; }
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        if (topicId === undefined) {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } else {
            const index = store.index('topicId');
            const request = index.openKeyCursor(IDBKeyRange.only(topicId));
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        }
     });
  }
}

const storage = new StorageService();
