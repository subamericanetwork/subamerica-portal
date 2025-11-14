import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/jukebox-player.css";
// PWA TEMPORARILY DISABLED FOR DEBUGGING
// import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA functionality
// if ('serviceWorker' in navigator) {
//   registerSW({
//     immediate: true,
//     onNeedRefresh() {
//       console.log('[PWA] New content available, updating...');
//       // Auto-reload to get new version
//       window.location.reload();
//     },
//     onOfflineReady() {
//       console.log('[PWA] App ready to work offline');
//     },
//     onRegistered(registration) {
//       console.log('[PWA] Service Worker registered successfully');
//       console.log('[PWA] Registration:', registration);
//     },
//     onRegisterError(error) {
//       console.error('[PWA] Service Worker registration failed:', error);
//     }
//   });
// }

createRoot(document.getElementById("root")!).render(<App />);
