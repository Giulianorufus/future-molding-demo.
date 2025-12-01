import React from "react";
import "./header.css"; // resta opzionale; il componente usa classi Tailwind di base

type AppHeaderProps = {
  rightSlot?: React.ReactNode;       // es: selettore lingua, badge, ecc.
  onLogoClick?: () => void;          // se passato, click su logo -> Home
  centerLogoOnMobile?: boolean;      // default true
  className?: string;
};

export default function AppHeader({
  rightSlot,
  onLogoClick,
  centerLogoOnMobile = true,
  className = "",
}: AppHeaderProps) {
  return (
    <header className={`app-header border-b text-slate-900 ${className}`}>
      {/* Barra superiore blu + secondary */}
      <div className="w-full bg-primary h-3" />
      <div className="w-full bg-secondary h-[6px]" />

      {/* Contenuto header */}
      <div
        className={`
          container-page py-3
          flex items-center justify-between
        `}
      >
        {/* Logo / Titolo */}
        <button
          type="button"
          onClick={onLogoClick}
          className={`
            text-sm sm:text-base font-semibold tracking-wide
            text-gray-900 hover:opacity-80 transition
            ${centerLogoOnMobile ? "mx-auto sm:mx-0" : ""}
          `}
          aria-label="Torna alla Dashboard"
        >
          Future Molding  
        </button>

        {/* Slot destro */}
        <div className="ml-4 shrink-0 hidden sm:flex items-center">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}