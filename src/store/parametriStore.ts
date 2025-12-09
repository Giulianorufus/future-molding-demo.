// Compatibility shim: provide a legacy-compatible hook that composes canonical stores
import { useParametriStore as useParametriStoreCanonical } from "@/stores/parametriStore";
import { usePressStore } from "@/stores/pressStore";
import { useMaterialStore } from "@/stores/materialStore";
import { useDrawingStore } from "@/stores/drawingStore";
import { useDefectsStore } from "@/stores/defectsStore";

/**
 * Legacy-compatible hook used by older pages. It composes multiple canonical stores
 * and exposes a small compatibility surface (read-only or delegating to canonical
 * actions) so older UI files continue to work without large rewrites.
 */
export const useParametriStore = (selector?: any) => {
	// canonical parametri store selectors
	const result = useParametriStoreCanonical((s) => s.result);
	const loading = useParametriStoreCanonical((s) => s.loading);
	const error = useParametriStoreCanonical((s) => s.error);
	const lastInput = useParametriStoreCanonical((s) => s.lastInput);
	const ricalcola = useParametriStoreCanonical((s) => s.ricalcola);
	const reset = useParametriStoreCanonical((s) => s.reset);

	// press/material/drawing stores (map legacy names)
	const pressaId = usePressStore((s) => s.selectedPressId);
	const screwDiameter_mm = usePressStore((s) => s.selectedScrewDiameter_mm);
	const setPressaId = usePressStore((s) => s.selectPress);
	const setScrewDiameter = usePressStore((s) => s.selectScrewDiameter);

	const materialeId = useMaterialStore((s) => s.selectedMaterialId);
	const setMaterialeId = useMaterialStore((s) => s.selectMaterial);

	// geometry shim (legacy UI expects `geometry` on the parametri store)
	const geometry = (() => {
		const d = useDrawingStore((s) => ({
			volumeCm3: s.volumeCm3,
			areaCm2: (s as any).areaCm2 ?? s.surfaceCm2,
			boundingBox: s.boundingBox,
		}));
		return {
			volumePezzo_cm3: d.volumeCm3 ?? null,
			areaProiettata_cm2: d.areaCm2 ?? null,
			boundingBox: d.boundingBox ?? null,
		};
	})();

	// defects
	const defect = useDefectsStore((s) => s.selectedDefectId);

	// calculated alias
	const calculated = result;

	// applyDefectFix: re-run canonical ricalcola with current lastInput (no logic change)
	const applyDefectFix = async () => {
		try {
			const input = lastInput ?? useDrawingStore.getState()?.volumeCm3 ? { volumeCm3: useDrawingStore.getState().volumeCm3 } : null;
			if (input && typeof ricalcola === 'function') await ricalcola(input as any);
		} catch (e) {
			// swallow here; canonical store surfaces errors
		}
	};

	// calculate convenience (legacy name `calculate`)
	const calculate = async () => {
		if (lastInput && typeof ricalcola === 'function') return ricalcola(lastInput as any);
		// fallback: attempt to build a minimal input from drawing/press/material
		const d = useDrawingStore.getState();
		const p = usePressStore.getState();
		const m = useMaterialStore.getState();
		const pressEntry = p?.selectedPressId ? (p.catalog?.[p.selectedPressId] ?? null) : null;
		const materialEntry = m?.selectedMaterialId ? (m.catalog?.[m.selectedMaterialId] ?? null) : null;
		const baseInput = {
			volumeCm3: d?.volumeCm3 ?? 0,
			press: pressEntry
				? {
						id: p.selectedPressId,
						tonnellaggio: pressEntry.tonnellaggio,
						screwDiameters: pressEntry.screwDiameters || [],
						maxPressureBar: pressEntry.maxPressureBar,
						maxSpeedMmPerS: pressEntry.maxSpeedMmPerS,
					}
				: null,
			material: materialEntry
				? {
						id: m.selectedMaterialId,
						densityGPerCm3: materialEntry.densityGPerCm3,
						recommendedTemperatureC: materialEntry.recommendedTemperatureC,
					}
				: null,
		};
		if (typeof ricalcola === 'function') await ricalcola(baseInput as any);
	};

	const composed = {
		// legacy fields
		pressaId,
		screwDiameter_mm,
		materialeId,
		setPressaId,
		setScrewDiameter,
		setMaterialeId,
		calculate,
		geometry,
		defect,
		calculated,
		applyDefectFix,
		// also expose canonical surface for callers that expect it
		result,
		loading,
		error,
		lastInput,
		ricalcola,
		reset,
	};

	// If a selector is provided (legacy usage like `useParametriStore(s => s.foo)`),
	// apply it to the composed object. Otherwise return the whole object.
	if (typeof selector === 'function') return selector(composed as any);
	return composed as any;
};

export type ParametriState = any;

export default useParametriStore;
