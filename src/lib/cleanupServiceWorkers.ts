/**
 * Service Worker Cleanup Utility
 * Removes all service workers and caches from previous PWA implementation
 */

const CLEANUP_FLAG = 'sw_cleanup_completed';
const CLEANUP_VERSION = '1.0';

export async function cleanupServiceWorkers(): Promise<void> {
  // Check if cleanup already completed
  const cleanupCompleted = localStorage.getItem(CLEANUP_FLAG);
  if (cleanupCompleted === CLEANUP_VERSION) {
    console.log('[SW Cleanup] Already completed, skipping');
    return;
  }

  console.log('[SW Cleanup] Starting service worker and cache cleanup...');

  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log(`[SW Cleanup] Found ${registrations.length} service worker(s), unregistering...`);
        
        await Promise.all(
          registrations.map(async (registration) => {
            await registration.unregister();
            console.log('[SW Cleanup] Unregistered service worker:', registration.scope);
          })
        );
        
        console.log('[SW Cleanup] ✅ All service workers unregistered');
      } else {
        console.log('[SW Cleanup] No service workers found');
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      if (cacheNames.length > 0) {
        console.log(`[SW Cleanup] Found ${cacheNames.length} cache(s), deleting...`);
        
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            await caches.delete(cacheName);
            console.log('[SW Cleanup] Deleted cache:', cacheName);
          })
        );
        
        console.log('[SW Cleanup] ✅ All caches cleared');
      } else {
        console.log('[SW Cleanup] No caches found');
      }
    }

    // Mark cleanup as completed
    localStorage.setItem(CLEANUP_FLAG, CLEANUP_VERSION);
    console.log('[SW Cleanup] ✅ Cleanup completed successfully');

  } catch (error) {
    console.error('[SW Cleanup] ❌ Error during cleanup:', error);
    // Don't throw - allow app to continue loading even if cleanup fails
  }
}
