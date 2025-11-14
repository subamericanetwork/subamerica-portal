import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/jukebox-player.css";

console.log('[DEBUG] PWA disabled - app starting without service worker');

createRoot(document.getElementById("root")!).render(<App />);
