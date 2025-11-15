import { Session } from "@supabase/supabase-js";

class AuthStorage {
  private dbName = 'supabase-auth';
  private storeName = 'auth-session';
  private dbVersion = 2;
  private dbPromise: Promise<IDBDatabase | null>;
  private syncChannel: BroadcastChannel | null = null;

  constructor() {
    this.dbPromise = this.initDB();
    
    if ('BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel('auth-sync');
      } catch (error) {
        console.warn('[AuthStorage] BroadcastChannel not available:', error);
      }
    }
  }

  private async initDB(): Promise<IDBDatabase | null> {
    if (!('indexedDB' in window)) return null;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onerror = () => resolve(null);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      } catch (error) {
        resolve(null);
      }
    });
  }

  async setSession(session: Session | null): Promise<void> {
    if (session === null) {
      localStorage.removeItem('supabase-session');
      sessionStorage.removeItem('supabase-session-fallback');
      const db = await this.dbPromise;
      if (db) {
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.objectStore(this.storeName).delete('session');
      }
      this.syncChannel?.postMessage({ type: 'session-update', session: null });
      return;
    }

    try {
      localStorage.setItem('supabase-session', JSON.stringify(session));
    } catch {
      sessionStorage.setItem('supabase-session-fallback', JSON.stringify(session));
    }

    try {
      const db = await this.dbPromise;
      if (db) {
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.objectStore(this.storeName).put(session, 'session');
      }
    } catch {}
    
    this.syncChannel?.postMessage({ type: 'session-update', session });
  }

  async getSession(): Promise<Session | null> {
    try {
      const db = await this.dbPromise;
      if (db) {
        const tx = db.transaction(this.storeName, 'readonly');
        const result = await new Promise<Session | undefined>((resolve) => {
          const request = tx.objectStore(this.storeName).get('session');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
        });
        if (result && this.validateSession(result)) return result;
      }
    } catch {}

    try {
      const localSession = localStorage.getItem('supabase-session');
      if (localSession) {
        const session = JSON.parse(localSession) as Session;
        if (this.validateSession(session)) return session;
      }
    } catch {}
    
    try {
      const fallback = sessionStorage.getItem('supabase-session-fallback');
      if (fallback) {
        const session = JSON.parse(fallback) as Session;
        if (this.validateSession(session)) return session;
      }
    } catch {}

    return null;
  }

  private validateSession(session: Session): boolean {
    if (!session?.access_token || !session.user) return false;
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) return false;
    return true;
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem('supabase-session');
    sessionStorage.removeItem('supabase-session-fallback');
    const db = await this.dbPromise;
    if (db) {
      const tx = db.transaction(this.storeName, 'readwrite');
      await tx.objectStore(this.storeName).delete('session');
    }
    this.syncChannel?.postMessage({ type: 'session-update', session: null });
  }
}

export const authStorage = new AuthStorage();
