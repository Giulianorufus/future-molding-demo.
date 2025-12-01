import React from "react";
import { useNavigate } from "react-router-dom";
import Onboarding from "@/components/Onboarding";
import PlatformBanner from "@/components/PlatformBanner";

export default function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a1a2f] text-white font-sans flex flex-col">
      <PlatformBanner />
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 rounded-lg p-2">
            {/* Logo F stilizzato */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 28V4h24v6H12v4h12v6H12v8H4z" fill="#fff"/></svg>
          </div>
          <span className="text-2xl font-bold tracking-wide">FUTURE<br />MOLDING</span>
        </div>
        <button className="p-2" onClick={() => navigate("/impostazioni") }><svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg></button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-6 px-4 py-2 max-w-2xl mx-auto w-full">
        <Onboarding />
        <div className="grid grid-cols-2 gap-6">
          {/* Stato macchina */}
          <section className="bg-[#12284a] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Stato Macchina</h2>
            <div className="bg-[#18325a] rounded-xl p-4 flex flex-col items-center">
              <span className="text-4xl font-bold text-white">12,4s</span>
              <span className="text-xs text-slate-300 mt-1">Tempo ciclo attuale</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-300">Pressione <span className="text-white font-semibold">240</span> bar</span>
              <span className="text-slate-300">Temperatura <span className="text-white font-semibold">33</span>°C</span>
            </div>
            <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg py-2 transition" onClick={() => navigate("/parametri")}>Regola parametri</button>
          </section>

          {/* Difetti */}
          <section className="bg-[#12284a] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Difetti</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#18325a] rounded-xl flex flex-col items-center p-3 gap-1 hover:bg-[#1e3a6a] transition" onClick={() => navigate("/difetti") }>
                {/* Icona bava */}
                <svg width="36" height="24" viewBox="0 0 36 24" fill="#3b82f6"><rect x="2" y="8" width="32" height="8" rx="2"/></svg>
                <span className="text-xs mt-1">Bava</span>
              </button>
              <button className="bg-[#18325a] rounded-xl flex flex-col items-center p-3 gap-1 hover:bg-[#1e3a6a] transition" onClick={() => navigate("/difetti") }>
                {/* Icona colpo corto */}
                <svg width="32" height="24" viewBox="0 0 32 24" fill="#3b82f6"><rect x="4" y="8" width="24" height="8" rx="2"/><rect x="28" y="8" width="4" height="8" rx="2" fill="#0a1a2f"/></svg>
                <span className="text-xs mt-1">Colpo corto</span>
              </button>
              <button className="bg-[#18325a] rounded-xl flex flex-col items-center p-3 gap-1 hover:bg-[#1e3a6a] transition" onClick={() => navigate("/difetti") }>
                {/* Icona bolle */}
                <svg width="28" height="28" viewBox="0 0 28 28" fill="#3b82f6"><circle cx="14" cy="14" r="10"/><circle cx="18" cy="10" r="3" fill="#0a1a2f"/></svg>
                <span className="text-xs mt-1">Bolle</span>
              </button>
              <button className="bg-[#18325a] rounded-xl flex flex-col items-center p-3 gap-1 hover:bg-[#1e3a6a] transition" onClick={() => navigate("/difetti") }>
                {/* Icona deformazione */}
                <svg width="32" height="24" viewBox="0 0 32 24" fill="#3b82f6"><rect x="4" y="8" width="24" height="8" rx="6"/></svg>
                <span className="text-xs mt-1">Deformazione</span>
              </button>
            </div>
          </section>
        </div>

        {/* Blocchi placeholder per altri contenuti */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#18325a] rounded-2xl h-28 flex items-center justify-center cursor-pointer" onClick={() => navigate("/storico") }>
            <svg width="60" height="32" viewBox="0 0 60 32" fill="#3b82f6"><rect x="8" y="8" width="44" height="16" rx="4"/></svg>
            <span className="ml-2 text-xs text-slate-200">Storico</span>
          </div>
          <div className="bg-[#18325a] rounded-2xl h-28 flex items-center justify-center cursor-pointer" onClick={() => navigate("/help") }>
            <svg width="48" height="32" viewBox="0 0 48 32" fill="#3b82f6"><rect x="4" y="8" width="40" height="16" rx="6"/></svg>
            <span className="ml-2 text-xs text-slate-200">Guida</span>
          </div>
        </div>
      </main>

      {/* Footer menu */}
      <footer className="bg-[#12284a] py-3 px-4 flex justify-between items-center rounded-t-2xl shadow-inner mt-6">
        <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-yellow-400 transition" onClick={() => navigate("/") }>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"/></svg>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-yellow-400 transition" onClick={() => navigate("/parametri") }>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4"/></svg>
          <span className="text-xs">Calcola</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-yellow-400" onClick={() => navigate("/difetti") }>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v4l3 3"/></svg>
          <span className="text-xs font-semibold">Difetti</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-yellow-400 transition" onClick={() => navigate("/login") }>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"/></svg>
          <span className="text-xs">Profilo</span>
        </button>
      </footer>
    </div>
  );
}
