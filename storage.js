const DB_NAME = 'ChatbotPWA_DB';
const DB_VERSION = 1;

class StorageService {
  #initPromise = null;

  constructor() {
    this.db = null;
  }

  async init() {
    if (this.#initPromise) return this.#initPromise;

    this.#initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        if (!db.objectStoreNames.contains('topics')) {
          db.createObjectStore('topics', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('topicId', 'topicId', { unique: false });
          messageStore.createIndex('parentId', 'parentId', { unique: false });
        }

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

    return this.#initPromise;
  }

  async getSetting(key) {
    await this.init();
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
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSettingsKeys() {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTopics() {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['topics'], 'readonly');
      const store = transaction.objectStore('topics');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addTopic(topic) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['topics'], 'readwrite');
      const store = transaction.objectStore('topics');
      const request = store.add(topic);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async putTopic(topic) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['topics'], 'readwrite');
      const store = transaction.objectStore('topics');
      const request = store.put(topic);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllTopics() {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['topics'], 'readwrite');
      const store = transaction.objectStore('topics');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTopic(id) {
    await this.clearMessagesByTopic(id);
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['topics'], 'readwrite');
      const store = transaction.objectStore('topics');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMessagesByTopic(topicId) {
    await this.init();
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

  async getAllMessages() {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addMessage(message) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(message);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async putMessage(message) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(id) {
    await this.init();
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
    await this.init();
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

  async getAllPrompts() {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['prompts'], 'readonly');
      const store = transaction.objectStore('prompts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addPrompt(prompt) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['prompts'], 'readwrite');
      const store = transaction.objectStore('prompts');
      const request = store.add(prompt);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePrompt(prompt) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['prompts'], 'readwrite');
      const store = transaction.objectStore('prompts');
      const request = store.put(prompt);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePrompt(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not initialized'); return; }
      const transaction = this.db.transaction(['prompts'], 'readwrite');
      const store = transaction.objectStore('prompts');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new StorageService();
