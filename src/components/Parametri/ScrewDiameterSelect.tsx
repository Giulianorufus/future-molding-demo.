import React from 'react';
import { usePressStore } from '@/stores/pressStore';
import { useDrawingStore } from '@/stores/drawingStore';

const diametri = [14, 18, 22, 25, 30, 35];

export default function ScrewDiameterSelect() {
  const selectScrewDiameter = usePressStore((s) => s.selectScrewDiameter)
  const volume = useDrawingStore((s) => s.volumeCm3) ?? 0;

  return (
    <select
      defaultValue={''}
      onChange={(e) => {
        const v = e.target.value;
        const n = v === '' ? null : Number(v);
        selectScrewDiameter(n)
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
