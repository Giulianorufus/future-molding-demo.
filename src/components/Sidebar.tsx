import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Wrench,
  AlertTriangle,
  Database,
  Settings,
} from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-700 transition";
const linkActive =
  "bg-blue-900 border-l-4 border-yellow-400";

export default function Sidebar() {
  return (
    <div className="w-60 bg-blue-800 text-white flex flex-col py-4">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <LayoutDashboard size={20} /> Dashboard
      </NavLink>

      <NavLink
        to="/disegni"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <FileText size={20} /> Disegni
      </NavLink>

      <NavLink
        to="/parametri"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <Wrench size={20} /> Parametri
      </NavLink>

      <NavLink
        to="/raccolta-dati"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <Database size={20} /> Raccolta Dati
      </NavLink>

      <NavLink
        to="/difetti"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <AlertTriangle size={20} /> Difetti
      </NavLink>

      <NavLink
        to="/impostazioni"
        className={({ isActive }) =>
          isActive ? `${linkBase} ${linkActive}` : linkBase
        }
      >
        <Settings size={20} /> Impostazioni
      </NavLink>
    </div>
  );
}
