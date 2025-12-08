import React from 'react';
import { useDefectsStore } from '../../stores/defectsStore';

const known: { id: string; label: string }[] = [
  { id: 'SHORT_SHOT', label: 'Short shot' },
  { id: 'BAVE', label: 'Bave' },
  { id: 'RITIRO', label: 'Cedimento' },
  { id: 'PUNTINATURA', label: 'Puntinatura' },
  { id: 'DEFORMAZIONE', label: 'Deformazione' },
];

const DefectList: React.FC = () => {
  const setSelectedDefect = useDefectsStore((s) => s.setSelectedDefect);
  const selected = useDefectsStore((s) => s.selectedDefectId);

  return (
    <div>
      <h3>Elenco difetti</h3>
      <ul>
        {known.map((d) => (
          <li key={d.id} style={{ margin: '8px 0' }}>
            <button
              type="button"
              onClick={() => setSelectedDefect(d.id)}
              style={{ border: selected === d.id ? '2px solid #FFCC00' : undefined }}
            >
              {d.label}
            </button>
          </li>
        ))}
      </ul>
      <p>Seleziona un difetto per visualizzare suggerimenti o applicare una correzione automatica.</p>
    </div>
  );
};

export default DefectList;
