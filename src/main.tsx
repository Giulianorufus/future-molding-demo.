import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";

import Layout from "./layout/Layout";
import ParametriPage from "./pages/ParametriPage";
import { ErrorBoundary } from "./app/ErrorBoundary";

import Dashboard from "./pages/Dashboard";
import Disegni from "./pages/Disegni";
import Parametri from "./pages/Parametri";
import RaccoltaDati from "./pages/RaccoltaDati";
import Difetti from "./pages/Difetti";
import Impostazioni from "./pages/Impostazioni";

import "./index.css";
import { killOcct } from '@/lib/occtInit';

const router = createHashRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "disegni", element: <Disegni /> },
      { path: "parametri", element: <ParametriPage /> },
      { path: "raccolta-dati", element: <RaccoltaDati /> },
      { path: "difetti", element: <Difetti /> },
      { path: "impostazioni", element: <Impostazioni /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Attempt to free occt resources when the page is unloaded.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      // fire-and-forget, do not block unload
      killOcct(1000, 0).catch(() => {});
    } catch (e) {
      // ignore
    }
  });
}

// Dev helper: ensure any Service Worker registrations are removed while
// developing to avoid message-channel errors originating from stale SWs.
if (import.meta.env.DEV && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((r) => {
        r.unregister()
          .then((ok) => {
            if (ok) console.info("[dev] unregistered service worker:", r.scope);
          })
          .catch((err) => console.warn("[dev] failed to unregister SW:", err));
      });
    })
    .catch((err) => console.warn("[dev] getRegistrations failed:", err));
}
