/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import  App  from "./client/App";
import { ComponentProvider } from "./lib/component-context";
import { loadComponentConfig } from "./lib/component-registry";

const elem = document.getElementById("root")!;

// Load component configurations and then render the app
(async () => {
  await loadComponentConfig();
  
  const app = (
    <StrictMode>
      <ComponentProvider>
        <App />
      </ComponentProvider>
    </StrictMode>
  );

  if (import.meta.hot) {
    // With hot module reloading, `import.meta.hot.data` is persisted.
    const root = (import.meta.hot.data.root ??= createRoot(elem));
    root.render(app);
  } else {
    // The hot module reloading API is not available in production.
    createRoot(elem).render(app);
  }
})();
