import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Row = ({ label, value, unit }: { label: string; value?: number | string; unit?: string }) => (
  <div className="flex items-center justify-between py-1 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "—"}{unit ? ` ${unit}` : ""}</span>
  </div>
);

export function CalculatedPanel(props: {
  thickness_mm?: number;
  cavityVolume_cm3?: number;
  runnerVolume_cm3?: number;
  cushionTarget_cm3?: number;
}) {
  const { thickness_mm, cavityVolume_cm3, runnerVolume_cm3, cushionTarget_cm3 } = props;
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Parametri calcolati</CardTitle>
      </CardHeader>
      <CardContent>
        <Row label="Spessore medio" value={thickness_mm} unit="mm" />
        <Separator className="my-2" />
        <Row label="Volume cavità" value={cavityVolume_cm3} unit="cm³" />
        <Row label="Volume materozza" value={runnerVolume_cm3} unit="cm³" />
        <Row label="Cushion target (auto)" value={cushionTarget_cm3} unit="cm³" />
      </CardContent>
    </Card>
  );
}

