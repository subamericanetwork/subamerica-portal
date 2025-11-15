import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/jukebox-player.css";
import { cleanupServiceWorkers } from "./lib/cleanupServiceWorkers";

console.log('[DEBUG] PWA disabled - app starting without service worker');

// Run service worker cleanup before rendering app
cleanupServiceWorkers()
  .then(() => {
    console.log('[Main] Service worker cleanup complete, rendering app');
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((error) => {
    // Fail-safe: render app even if cleanup fails
    console.error('[Main] Cleanup failed, rendering app anyway:', error);
    createRoot(document.getElementById("root")!).render(<App />);
  });
