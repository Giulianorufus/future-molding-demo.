import React from 'react';
import useParametriStore from '../../store/parametriStore';

const DefectAI: React.FC = () => {
  const defect = useParametriStore((s) => s.defect);
  const calculated = useParametriStore((s) => s.calculated);
  const applyFix = useParametriStore((s) => s.applyDefectFix);

  if (!defect) return <div><p>Nessun difetto selezionato.</p></div>;

  return (
    <div>
      <h3>Analisi per: {defect}</h3>
      <div>
        <p>Parametri correnti:</p>
        <pre style={{ background: '#f6f6f6', padding: 10 }}>{JSON.stringify(calculated || {}, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => applyFix()}>Applica correzione automatica</button>
      </div>
    </div>
  );
};

export default DefectAI;
