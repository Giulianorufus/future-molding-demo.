import React from 'react';
import { useParametriStore } from '@/stores/parametriStore';
import { useDrawingStore } from '@/stores/drawingStore';

const diametri = [14, 18, 22, 25, 30, 35];

export default function ScrewDiameterSelect() {
  const ricalcola = useParametriStore((s) => s.ricalcola);
  const volume = useDrawingStore((s) => s.volumeCm3) ?? 0;

  return (
    <select
      defaultValue={''}
      onChange={(e) => {
        const v = e.target.value;
        const n = v === '' ? undefined : Number(v);
        const press = n ? { id: 'manual', tonnellaggio: 0, screwDiameters: [n], maxPressureBar: 0, maxSpeedMmPerS: 0 } : null;
        void ricalcola({ volumeCm3: volume, press } as any);
      }}
      className="w-full p-2 border rounded-lg bg-white"
    >
      <option value="">Seleziona la vite</option>
      {diametri.map((d) => (
        <option key={d} value={d}>
          {d} mm
        </option>
      ))}
    </select>
  );
}
