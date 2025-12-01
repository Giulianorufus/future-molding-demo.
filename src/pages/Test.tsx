import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Test() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area di test</CardTitle>
      </CardHeader>
      <CardContent>
        Qui puoi provare componenti e flussi senza impattare i dati.
      </CardContent>
    </Card>
  );
}
