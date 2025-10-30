import { Session } from "@supabase/supabase-js";

const DB_NAME = "subamerica_auth";
const STORE_NAME = "sessions";
const SESSION_KEY = "auth_session";

class AuthStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        console.warn("[AuthStorage] IndexedDB not available, falling back to localStorage");
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.error("[AuthStorage] Failed to open IndexedDB", request.error);
        resolve(); // Don't reject, fall back to localStorage
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[AuthStorage] IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
          console.log("[AuthStorage] Created object store");
        }
      };
    });
  }

  async setSession(session: Session | null): Promise<void> {
    await this.initPromise;

    // Always store in localStorage as backup
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error("[AuthStorage] Failed to store in localStorage", error);
    }

    // Also store in IndexedDB for better persistence
    if (this.db) {
      try {
        const transaction = this.db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        if (session) {
          await new Promise<void>((resolve, reject) => {
            const request = store.put(session, SESSION_KEY);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          console.log("[AuthStorage] Session stored in IndexedDB");
        } else {
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(SESSION_KEY);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          console.log("[AuthStorage] Session removed from IndexedDB");
        }
      } catch (error) {
        console.error("[AuthStorage] Failed to store in IndexedDB", error);
      }
    }
  }

  async getSession(): Promise<Session | null> {
    await this.initPromise;

    // Try IndexedDB first (more persistent on mobile)
    if (this.db) {
      try {
        const transaction = this.db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const session = await new Promise<Session | null>((resolve, reject) => {
          const request = store.get(SESSION_KEY);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });

        if (session) {
          console.log("[AuthStorage] Session retrieved from IndexedDB");
          return this.validateSession(session);
        }
      } catch (error) {
        console.error("[AuthStorage] Failed to retrieve from IndexedDB", error);
      }
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        console.log("[AuthStorage] Session retrieved from localStorage");
        return this.validateSession(session);
      }
    } catch (error) {
      console.error("[AuthStorage] Failed to retrieve from localStorage", error);
    }

    return null;
  }

  private validateSession(session: Session): Session | null {
    if (!session || !session.access_token) {
      console.warn("[AuthStorage] Invalid session structure");
      return null;
    }

    // Check if session is expired
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();

      if (expiresAt < now) {
        console.warn("[AuthStorage] Session expired");
        return null;
      }
    }

    return session;
  }

  async clearSession(): Promise<void> {
    await this.initPromise;

    // Clear from localStorage
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("[AuthStorage] Failed to clear localStorage", error);
    }

    // Clear from IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        await new Promise<void>((resolve, reject) => {
          const request = store.delete(SESSION_KEY);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        console.log("[AuthStorage] Session cleared from IndexedDB");
      } catch (error) {
        console.error("[AuthStorage] Failed to clear IndexedDB", error);
      }
    }
  }
}

export const authStorage = new AuthStorage();
