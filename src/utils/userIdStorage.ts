// Store user ID in IndexedDB for service worker verification
// This allows the service worker to verify push notifications are for the correct user

// Cache to prevent excessive writes
let lastStoredUserId: string | null = null;

export async function storeUserIdInIndexedDB(userId: string): Promise<void> {
  // Skip if we already stored this user ID
  if (lastStoredUserId === userId) {
    return;
  }
  
  try {
    // First check if it's already stored
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mypartsrunner-user', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
      };
    });
    
    // Check current value first
    const readTx = db.transaction('user', 'readonly');
    const readStore = readTx.objectStore('user');
    const currentUserId = await new Promise<string | null>((resolve, reject) => {
      const request = readStore.get('userId');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    // Only store if different
    if (currentUserId === userId) {
      lastStoredUserId = userId;
      return;
    }
    
    const tx = db.transaction('user', 'readwrite');
    const store = tx.objectStore('user');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(userId, 'userId');
      request.onsuccess = () => {
        lastStoredUserId = userId;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ User ID stored in IndexedDB for service worker verification:', userId);
  } catch (error) {
    console.error('❌ Error storing user ID in IndexedDB:', error);
  }
}

export async function clearUserIdFromIndexedDB(): Promise<void> {
  try {
    lastStoredUserId = null;
    
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mypartsrunner-user', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
      };
    });
    
    const tx = db.transaction('user', 'readwrite');
    const store = tx.objectStore('user');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete('userId');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ User ID cleared from IndexedDB');
  } catch (error) {
    console.error('❌ Error clearing user ID from IndexedDB:', error);
  }
}

