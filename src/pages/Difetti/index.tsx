import React from 'react';
import DefectList from './DefectList';
import DefectAI from './DefectAI';

const DifettiPage: React.FC = () => {
  return (
    <div className="difetti-page">
      <h2>Difetti</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <DefectList />
        </div>
        <div style={{ flex: 2 }}>
          <DefectAI />
        </div>
      </div>
    </div>
  );
};

export default DifettiPage;
