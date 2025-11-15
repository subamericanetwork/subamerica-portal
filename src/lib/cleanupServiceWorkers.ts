/**
 * Service Worker Cleanup Utility
 * Removes OLD/BROKEN service workers from previous PWA implementation
 * Preserves NEW VitePWA service workers (v2.0+)
 */

const CLEANUP_FLAG = 'sw_cleanup_completed';
const CLEANUP_VERSION = '2.0'; // Updated for new PWA implementation
const VITEPWA_SCOPE = '/'; // VitePWA service worker scope

export async function cleanupServiceWorkers(): Promise<void> {
  const startTime = Date.now();
  console.log('[SW Cleanup] [START] Cleanup initiated at', new Date().toISOString());
  
  // Check if cleanup already completed
  const cleanupCompleted = localStorage.getItem(CLEANUP_FLAG);
  if (cleanupCompleted === CLEANUP_VERSION) {
    console.log('[SW Cleanup] Already completed, skipping (took 0ms)');
    return Promise.resolve();
  }

  console.log('[SW Cleanup] Starting service worker and cache cleanup...');

  try {
    // Unregister ONLY old/broken service workers, keep VitePWA ones
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log(`[SW Cleanup] Found ${registrations.length} service worker(s), checking versions...`);
        
        let removedCount = 0;
        for (const registration of registrations) {
          // Check if this is a VitePWA service worker (v2.0+)
          const scriptURL = registration.active?.scriptURL || '';
          const isVitePWA = scriptURL.includes('sw.js') || scriptURL.includes('workbox');
          
          // Only remove if it's NOT a VitePWA service worker
          if (!isVitePWA && registration.scope !== window.location.origin + VITEPWA_SCOPE) {
            await registration.unregister();
            console.log('[SW Cleanup] Removed old service worker:', registration.scope);
            removedCount++;
          } else {
            console.log('[SW Cleanup] Keeping VitePWA service worker:', registration.scope);
          }
        }
        
        if (removedCount > 0) {
          console.log(`[SW Cleanup] ✅ Removed ${removedCount} old service worker(s)`);
        } else {
          console.log('[SW Cleanup] All service workers are current');
        }
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
    const endTime = Date.now();
    console.log(`[SW Cleanup] ✅ Cleanup completed successfully in ${endTime - startTime}ms`);
    console.log('[SW Cleanup] [END] Returning control to main.tsx');

  } catch (error) {
    const endTime = Date.now();
    console.error(`[SW Cleanup] ❌ Error during cleanup (after ${endTime - startTime}ms):`, error);
    // Don't throw - allow app to continue loading even if cleanup fails
  }
  
  return Promise.resolve();
}
