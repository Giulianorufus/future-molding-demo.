import React from 'react';
import { useAppStore } from '@/store/appStore';

const diametri = [14, 18, 22, 25, 30, 35];

export default function ScrewDiameterSelect() {
  const { screwDiameter, setScrewDiameter } = useAppStore();

  return (
    <select
      value={screwDiameter ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        setScrewDiameter(v === '' ? null : Number(v));
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
