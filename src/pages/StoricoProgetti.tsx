import React from "react";

export default function StoricoProgetti() {
  // Demo: lista progetti fittizia
  const progetti = [
    { id: 1, nome: "Coperchio scatola", data: "2025-10-01", operatore: "Mario" },
    { id: 2, nome: "Supporto staffa", data: "2025-10-03", operatore: "Luca" },
  ];
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Storico Progetti</h1>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="py-2 px-4 text-left">Nome</th>
            <th className="py-2 px-4 text-left">Data</th>
            <th className="py-2 px-4 text-left">Operatore</th>
          </tr>
        </thead>
        <tbody>
          {progetti.map(p => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 px-4">{p.nome}</td>
              <td className="py-2 px-4">{p.data}</td>
              <td className="py-2 px-4">{p.operatore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
