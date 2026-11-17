import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./shadcn.css";
import "./bodega.css";
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
if (import.meta.env.PROD && "serviceWorker" in navigator)
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      console.warn(
        "No se pudo activar el modo sin conexión. Recarga cuando tengas conexión.",
      );
    });
  });
