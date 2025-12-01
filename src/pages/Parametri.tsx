import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Parametri() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <SlidersHorizontal className="text-amber-500" />
        <CardTitle>Parametri</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">Consulta e modifica i parametri di stampaggio.
        Ottimizza i valori per ogni materiale e macchina.</p>
        <div className="mt-4">
          <Button asChild>
            <Link to="/parametri">Apri configuratore parametri</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
