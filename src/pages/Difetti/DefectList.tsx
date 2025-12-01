import React from 'react';
import useParametriStore from '../../store/parametriStore';

const known = [
  'Short shot',
  'Bave',
  'Cedimento',
  'Puntinatura',
  'Deformazione',
];

const DefectList: React.FC = () => {
  const setDefect = useParametriStore((s) => s.setDefect);

  return (
    <div>
      <h3>Elenco difetti</h3>
      <ul>
        {known.map((d) => (
          <li key={d} style={{ margin: '8px 0' }}>
            <button type="button" onClick={() => setDefect(d)}>{d}</button>
          </li>
        ))}
      </ul>
      <p>Seleziona un difetto per visualizzare suggerimenti o applicare una correzione automatica.</p>
    </div>
  );
};

export default DefectList;
