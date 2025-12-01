import React, { useState } from "react";
import { useUserStore } from "@/store/userStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useUserStore((s) => s.login);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Demo: login fittizio
    if (username === "admin" && password === "admin") {
      login({ id: "1", name: "Admin", role: "admin", token: "demo-token" });
    } else if (username === "operatore" && password === "operatore") {
      login({ id: "2", name: "Operatore", role: "operatore", token: "demo-token" });
    } else {
      setError("Credenziali non valide");
      return;
    }
    setError("");
    window.location.hash = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form className="bg-white p-8 rounded-xl shadow max-w-xs w-full space-y-4" onSubmit={handleLogin}>
        <h1 className="text-xl font-bold mb-2">Login</h1>
        <input type="text" className="w-full border rounded px-3 py-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" className="w-full border rounded px-3 py-2" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded font-semibold">Accedi</button>
      </form>
    </div>
  );
}
