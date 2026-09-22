import React, { useState } from 'react'
import Step1Drawing from './wizard/Step1Drawing'
import Step2Mold from './wizard/Step2Mold'
import Step2Press from './wizard/Step2Press'
import Step3Material from './wizard/Step3Material'
import Step4Parametri from './wizard/Step4Parametri'

const steps = [
  { id: 1, title: 'Carica disegno' },
  { id: 2, title: 'Stampo' },
  { id: 3, title: 'Pressa + vite' },
  { id: 4, title: 'Materiale' },
  { id: 5, title: 'Parametri' },
]

export default function Wizard() {
  const [index, setIndex] = useState(0)

  const canAdvance = (i: number) => {
    // child steps control enabling via props/callbacks; we simply allow navigation
    return true
  }

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Wizard Future Molding</h1>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.id} className="flex-1">
            <div className={`w-full h-2 rounded ${i <= index ? 'bg-blue-600' : 'bg-yellow-300'}`} />
            <div className="text-xs text-center mt-1 text-blue-800">{s.title}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-blue-900 rounded-lg p-4 mb-4">
        {index === 0 && <Step1Drawing onNext={() => setIndex(1)} />}
        {index === 1 && <Step2Mold onNext={() => setIndex(2)} onBack={() => setIndex(0)} />}
        {index === 2 && <Step2Press onNext={() => setIndex(3)} onBack={() => setIndex(1)} />}
        {index === 3 && <Step3Material onNext={() => setIndex(4)} onBack={() => setIndex(2)} />}
        {index === 4 && <Step4Parametri onBack={() => setIndex(3)} />}
      </div>

      <div className="flex justify-between mt-4">
        <button className="px-4 py-2 bg-gray-100 border rounded text-sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Indietro
        </button>
        <div />
      </div>
    </div>
  )
}
