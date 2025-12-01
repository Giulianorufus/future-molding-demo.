import React from "react";
import { getPlatformLabel } from "@/utils/platform";

export default function PlatformBanner() {
  return (
    <div className="fixed top-2 right-2 bg-blue-900 text-white px-3 py-1 rounded shadow text-xs z-50 opacity-80">
      {getPlatformLabel() === "App Mobile"
        ? "Stai usando la versione APP MOBILE"
        : "Stai usando la versione WEB"}
    </div>
  );
}
