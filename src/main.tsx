import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";
import "./components/jukebox-player.css";
import { cleanupServiceWorkers } from "./lib/cleanupServiceWorkers";

console.log('[Main] [1/5] Starting application initialization...');
console.log('[Main] PWA disabled - app starting without service worker');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[Main] ❌ CRITICAL: Root element not found!');
  throw new Error('Root element #root not found in DOM');
}

console.log('[Main] [2/5] Root element found, starting cleanup...');

// Add timeout fallback to ensure app renders even if cleanup hangs
let rendered = false;
const timeoutId = setTimeout(() => {
  if (!rendered) {
    console.warn('[Main] ⚠️ Timeout reached (2s), force-rendering app...');
    try {
      createRoot(rootElement).render(<App />);
      rendered = true;
      console.log('[Main] ✅ App force-rendered successfully');
    } catch (error) {
      console.error('[Main] ❌ Force-render failed:', error);
    }
  }
}, 2000);

// Run service worker cleanup before rendering app
console.log('[Main] [3/5] Calling cleanupServiceWorkers()...');
cleanupServiceWorkers()
  .then(() => {
    console.log('[Main] [4/5] Cleanup promise resolved');
    if (!rendered) {
      clearTimeout(timeoutId);
      console.log('[Main] [5/5] Rendering React app...');
      try {
        createRoot(rootElement).render(<App />);
        rendered = true;
        console.log('[Main] ✅ React app mounted successfully');
      } catch (error) {
        console.error('[Main] ❌ React render error:', error);
      }
    }
  })
  .catch((error) => {
    console.error('[Main] ❌ Cleanup promise rejected:', error);
    if (!rendered) {
      clearTimeout(timeoutId);
      console.log('[Main] Rendering app despite cleanup error...');
      try {
        createRoot(rootElement).render(<App />);
        rendered = true;
        console.log('[Main] ✅ App rendered after cleanup error');
      } catch (renderError) {
        console.error('[Main] ❌ Render failed:', renderError);
      }
    }
  });
