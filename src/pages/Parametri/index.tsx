import React, { useState } from "react";
import { useParametriStore } from "../../store/parametriStore";
import { calculateParameters } from "../../engine/calcEngine";
import CalculatedParameters from "./CalculatedParameters";
import ExportRecipeButton from '../../components/ExportRecipeButton';
import { getBrands, getModels, getPressSpecs } from "../../lib/pressData";
import { getMaterialById } from "../../engine/materialData";
import { CADUpload } from '@/components/CADUpload';
import { PressProfile, PressBrand } from "../../engine/pressProfiles";

export default function ParametriPage() {
  const {
    pressa,
    modelloPressa,
    materiale,
    geometry,
    result,
    setPressa,
    setModelloPressa,
    setMateriale,
    setGeometry,
    setResult,
  } = useParametriStore() as any; // compat shim for legacy page using old store shape

  const [loading, setLoading] = useState(false);

  const onAnalysisComplete = (analysis: any) => {
    // map AnalysisResult -> parametriStore.geometry
    const vol = analysis?.volume ?? null;
    const proj = analysis?.projectedArea_cm2 ?? analysis?.projectedArea_cm2 ?? null;
    const thicknessMean = (analysis?.thickness_map && analysis.thickness_map.length > 1) ? analysis.thickness_map[1] : (analysis?.thickness_min ? (analysis.thickness_min + (analysis.thickness_max||analysis.thickness_min))/2 : null);
    // volumeMaterozza default: add 10% for runner/materozza estimate
    const volMaterozza = vol ? Math.round(vol * 1.1 * 100) / 100 : null;
    setGeometry({
      volumePezzo_cm3: vol ?? null,
      volumeMaterozza_cm3: volMaterozza,
      areaProiettata_cm2: proj ?? null,
      spessoreMedio_mm: thicknessMean ?? null,
    });
  };

  const readyToCalculate =
    pressa &&
    modelloPressa &&
    materiale &&
    geometry.volumePezzo_cm3 &&
    geometry.volumeMaterozza_cm3 &&
    geometry.areaProiettata_cm2 &&
    geometry.spessoreMedio_mm;

  const handleCalcolo = () => {
    if (!readyToCalculate) return;

    const macchina = getPressSpecs(pressa!, modelloPressa!);
    const mat = getMaterialById(materiale);

    setLoading(true);

    // Adapter to the new engine.calculateParameters API
    const out = calculateParameters({
      material: mat as any,
      press: masinaOrFallback(macchina),
      screwDiameter: (macchina && (macchina.screwDiameter_mm || (macchina as any).screwDiameter_mm)) || 25,
      projAreaCm2: geometry.areaProiettata_cm2!,
      volumeCm3: geometry.volumePezzo_cm3!,
    });

    setResult(out);
    setLoading(false);
  };

  // small helper: provide a compatible press profile shape expected by the engine
  function mapToPressBrand(v: any): PressBrand {
    if (!v) return 'arburg';
    const s = String(v).toLowerCase();
    if (s.includes('arburg')) return 'arburg';
    if (s.includes('engel')) return 'engel';
    if (s.includes('bmb')) return 'bmb';
    if (s.includes('toyo') || s.includes('toyota')) return 'toyo';
    // fallback
    return 'arburg';
  }

  function masinaOrFallback(p: any): PressProfile {
    const id = p?.id ?? 'unknown';
    const brand = mapToPressBrand(p?.brand ?? p?.manufacturer ?? '');
    const label = p?.label ?? p?.model ?? String(p?.id ?? 'Model');
    const screwDiameters: number[] = Array.isArray(p?.screwDiameters)
      ? p.screwDiameters.map((v: any) => Number(v)).filter((n: number) => !Number.isNaN(n))
      : (p?.screwDiameter_mm ? [Number(p.screwDiameter_mm)] : []);
    const clampForceTon = Math.round((Number(p?.clampForce_kN || p?.clampForceTon || 0) / 9.80665) || 0);
    const maxSpeedCm3s = p?.maxInjectionSpeed_cm3s ?? p?.maxSpeedCm3s ?? undefined;
    const maxPressureBar = p?.maxInjectionPressure_bar ?? p?.maxPressureBar ?? undefined;
    const maxScrewRpm = p?.maxScrewRpm ?? undefined;
    const shotVolumeCm3 = p?.maxShot_cm3 ?? p?.maxShotCm3 ?? undefined;

    return {
      id,
      brand,
      label,
      clampForceTon,
      screwDiameters,
      shotVolumeCm3,
      maxSpeedCm3s,
      maxPressureBar,
      maxScrewRpm,
    };
  }


  return (
    <div className="w-full p-4 flex flex-col gap-6">
      
      {/* UPLOAD CAD */}
      <div className="bg-white border border-blue-900 rounded-lg p-4">
        <h2 className="text-blue-900 font-bold text-xl mb-2">Carica disegno</h2>
        <CADUpload onAnalysisComplete={onAnalysisComplete} />
        <p className="text-sm text-muted-foreground mt-2">Carica prima il disegno: le selezioni della pressa e del materiale saranno abilitate dopo l'analisi.</p>
      </div>

      {/* SELEZIONI */}
      <div className="bg-white border border-blue-900 rounded-lg p-4">
        <h2 className="text-blue-900 font-bold text-xl mb-2">Impostazioni</h2>

        {/* Seleziona pressa */}
        <div className="mb-3">
          <label className="block text-blue-900 font-semibold mb-1">Pressa</label>
          <select
            className="border border-blue-900 px-2 py-1 rounded bg-white"
            value={pressa || ""}
            onChange={(e) => setPressa(e.target.value)}
            disabled={!geometry.volumePezzo_cm3}
          >
          <CalculatedParameters />
            {getBrands().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {!geometry.volumePezzo_cm3 ? (
            <div className="text-xs text-muted-foreground mt-1">Carica un disegno valido per abilitare la selezione della pressa.</div>
          ) : null}
        </div>

        {/* Modello pressa */}
        {pressa && (
          <div className="mb-3">
            <label className="block text-blue-900 font-semibold mb-1">Modello pressa</label>
            <select
              className="border border-blue-900 px-2 py-1 rounded bg-white"
              value={modelloPressa || ""}
              onChange={(e) => setModelloPressa(e.target.value)}
            >
              <option value="">Seleziona modello</option>
              {getModels(pressa!).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Seleziona materiale */}
        <div className="mb-3">
          <label className="block text-blue-900 font-semibold mb-1">Materiale</label>
          <select
            className="border border-blue-900 px-2 py-1 rounded bg-white"
            value={materiale || ""}
            onChange={(e) => setMateriale(e.target.value)}
            disabled={!geometry.volumePezzo_cm3}
          >
            <option value="">Seleziona materiale</option>
            {['pp','abs','pcabs','pa66gf'].map((m) => (
              <option value={m} key={m}>{m.toUpperCase()}</option>
            ))}
          </select>
          {!geometry.volumePezzo_cm3 ? (
            <div className="text-xs text-muted-foreground mt-1">Carica un disegno valido per abilitare la selezione del materiale.</div>
          ) : null}
        </div>

      </div>

      {/* ANALISI CAD */}
      <div className="bg-white border border-blue-900 rounded-lg p-4">
        <h2 className="text-blue-900 font-bold text-xl mb-2">Dati geometrici (ricavati dal disegno)</h2>

        <div className="text-black">
          Volume pezzo: {geometry.volumePezzo_cm3 ?? "--"} cm³
        </div>
        <div className="text-black">
          Volume materozza: {geometry.volumeMaterozza_cm3 ?? "--"} cm³
        </div>
        <div className="text-black">
          Area proiettata: {geometry.areaProiettata_cm2 ?? "--"} cm²
        </div>
        <div className="text-black">
          Spessore medio: {geometry.spessoreMedio_mm ?? "--"} mm
        </div>
      </div>

      {/* BOTTONE CALCOLO */}
      <button
        disabled={!readyToCalculate || loading}
        onClick={handleCalcolo}
        className="bg-blue-900 text-white px-4 py-2 rounded-lg disabled:opacity-40"
      >
        {loading ? "Calcolo in corso..." : "Calcola parametri"}
      </button>

      {/* RISULTATO */}
      {result && (
        <>
          <CalculatedParameters result={result} />
          <div className="mt-4">
            <ExportRecipeButton />
          </div>
        </>
      )}

    </div>
  );
}
