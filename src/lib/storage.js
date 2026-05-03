/**
 * ProjectFlow KE - Persistent Storage Utility
 * Uses IndexedDB to bypass LocalStorage's 5MB quota.
 */

const DB_NAME = 'ProjectFlowStorage';
const STORE_NAME = 'pf_state';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const storage = {
  async get(key, defaultValue = null) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result !== undefined ? request.result : defaultValue);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[Storage] Failed to get ${key}:`, err);
      // Fallback to localStorage if IDB fails
      const lsValue = localStorage.getItem(key);
      return lsValue ? JSON.parse(lsValue) : defaultValue;
    }
  },

  async set(key, value) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[Storage] Failed to set ${key}:`, err);
      // Fallback to localStorage (might still throw QuotaExceededError)
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (lsErr) {
        console.error('[Storage] LocalStorage also failed:', lsErr);
      }
    }
  },

  async remove(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
