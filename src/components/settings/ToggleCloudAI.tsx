import React, { useEffect, useState } from 'react';
import { isCloudAIEnabled, setCloudAIEnabled } from '../../config/appConfig';

export const ToggleCloudAI: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(isCloudAIEnabled());
  }, []);

  const handleChange = () => {
    const next = !enabled;
    setEnabled(next);
    setCloudAIEnabled(next);
  };

  return (
    <button
      type="button"
      onClick={handleChange}
      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${
        enabled ? 'bg-blue-600 text-white' : 'bg-transparent'
      }`}
    >
      {enabled ? 'AI Cloud: ATTIVA' : "AI Cloud: DISATTIVATA (offline)"}
    </button>
  );
};

export default ToggleCloudAI;
