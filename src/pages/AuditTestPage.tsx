import React from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuditTestPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <ShieldCheck className="text-sky-500" />
        <CardTitle>Audit Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">Esegui test di audit sui parametri e verifica la conformità dei dati di produzione.</p>
        <div className="mt-4">
          <Button>Avvia audit</Button>
        </div>
      </CardContent>
    </Card>
  );
}

