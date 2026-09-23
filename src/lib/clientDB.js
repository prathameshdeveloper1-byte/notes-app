/**
 * Native Browser IndexedDB for permanent local storage of chapter topics.
 * Zero external dependencies (pure browser Web API).
 */

const DB_NAME = 'BookNotesAIIndex';
const STORE_NAME = 'chapter_topics';

function openTopicsDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'folderId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      console.warn('Could not open IndexedDB:', e);
      resolve(null);
    };
  });
}

export async function getTopicsFromIndexedDB(folderId) {
  try {
    const db = await openTopicsDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(folderId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveTopicsToIndexedDB(folderId, topics, metadata = {}) {
  try {
    const db = await openTopicsDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        folderId,
        topics,
        metadata,
        updatedAt: Date.now(),
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function removeTopicsFromIndexedDB(folderId) {
  try {
    const db = await openTopicsDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(folderId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
