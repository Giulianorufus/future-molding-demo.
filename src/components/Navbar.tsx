import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  AlertTriangle,
  Database,
  Wrench,
} from "lucide-react";

export default function Navbar() {
  const linkBase =
    "flex items-center gap-2 px-4 py-2 text-white hover:bg-blue-700";
  const linkActive =
    "bg-blue-900 border-b-4 border-yellow-400 font-semibold";

  return (
    <nav className="bg-blue-800 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-md font-bold tracking-wide">Future Molding</div>
      </div>

      <div className="flex border-b-4 border-yellow-400">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/disegni"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <FileText size={18} />
          Disegni
        </NavLink>

        <NavLink
          to="/parametri"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <Wrench size={18} />
          Parametri
        </NavLink>

        <NavLink
          to="/raccolta-dati"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <Database size={18} />
          Raccolta dati
        </NavLink>

        <NavLink
          to="/difetti"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <AlertTriangle size={18} />
          Difetti
        </NavLink>

        <NavLink
          to="/impostazioni"
          className={({ isActive }) =>
            isActive ? `${linkBase} ${linkActive}` : linkBase
          }
        >
          <Settings size={18} />
          Impostazioni
        </NavLink>
      </div>
    </nav>
  );
}
