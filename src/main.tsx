import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/jukebox-player.css";
import "./i18n/config";

console.log('[Main] Starting application...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element #root not found in DOM');
}

createRoot(rootElement).render(<App />);
console.log('[Main] ✅ App rendered successfully');
