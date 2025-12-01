
import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Barra blu con logo e titolo */}
      <header className="bg-blue-700 py-3 px-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 rounded-full p-2"><FileText size={28} className="text-blue-700" /></span>
          <span className="text-white font-bold text-xl">Future Molding</span>
        </div>
        <span className="ml-4 text-white text-base font-medium">Parametri di stampaggio semplici</span>
      </header>
      {/* Contenuto centrale */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 mt-8">Benvenuto in Future Molding</h1>
        <p className="text-lg text-slate-700 text-center mb-8">Trasforma i tuoi disegni in parametri di stampaggio ottimizzati con semplicità e precisione</p>
        <Link to="/parametri" className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-8 py-4 text-lg font-semibold flex items-center justify-center gap-2 shadow mb-4">
          <FileText size={22} /> Avvia Nuovo Progetto <ArrowRight size={22} />
        </Link>
      </main>
    </div>
  );
}
