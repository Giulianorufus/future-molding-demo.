import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, FileText, Settings, Wrench, AlertTriangle, Database } from "lucide-react";
import { Footer } from "./Footer"; // se il tuo Footer è default export, cambia in:  import Footer from "./Footer";

const navigation = [
  { name: "Dashboard",     href: "/",             icon: Home },
  { name: "Disegni",       href: "/disegni",      icon: FileText },
  { name: "Parametri",     href: "/parametri",    icon: Wrench },
  { name: "Raccolta dati", href: "/raccolta-dati",icon: Database },
  { name: "Difetti",       href: "/difetti",      icon: AlertTriangle },
  { name: "Impostazioni",  href: "/impostazioni", icon: Settings },
];

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-slate-100">
      {/* Top header */}
      <div className="topbar-primary border-b">
        <div className="container topbar-inner mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="logo text-2xl font-extrabold tracking-tight">Future Molding</button>
            <span className="text-xs text-slate-200">Parametro rapido • Analisi disegni</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {[{title:'Disegni',to:'/disegni',Icon:FileText},{title:'Materiale',to:'/parametri',Icon:Database},{title:'Pressa',to:'/parametri',Icon:Wrench},{title:'Difetti',to:'/difetti',Icon:AlertTriangle},{title:'Report',to:'/raccolta-dati',Icon:FileText}].map((it)=> (
                <button key={it.title} title={it.title} onClick={() => navigate(it.to)} className="topbar-icon" aria-label={it.title}>
                  <it.Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div>Operatore: <strong className="text-white">Manutentore</strong></div>
              <div className="px-2 py-1 fm-card-soft">v0.0.1</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-3 fm-card p-4">
          <nav className="flex flex-col gap-2">
            {navigation.map(({ name, href, icon: Icon }) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition ${isActive ? 'bg-amber-500/10 ring-1 ring-amber-400 text-amber-300' : 'text-slate-300'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="col-span-9">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <Outlet />
            </div>
            <div className="col-span-4">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
