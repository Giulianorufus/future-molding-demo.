// src/data/pressData.ts

export type ScrewDiameter = 20 | 25 | 30 | 35 | 40;

export type PressId =
	| "arburg-50t"
	| "arburg-80t"
	| "arburg-100t"
	| "arburg-150t"
	| "arburg-200t";

export interface InjectionUnitLimits {
	screwDiameter_mm: ScrewDiameter;
	maxShotVolume_cm3: number;
	maxInjectionPressure_bar: number;
	maxInjectionSpeed_cm3_s: number;
}

export interface PressMachine {
	id: PressId;
	nome: string;
	clampForce_kN: number; // 500/800/1000/1500/2000
	units: InjectionUnitLimits[];
	source?: string;
	version?: string;
}

export interface PressLimitClampResult {
	value: number;
	clamped: boolean;
}

export function clampToLimit(value: number, max: number): PressLimitClampResult {
	if (!Number.isFinite(value)) return { value, clamped: false };
	if (value <= max) return { value, clamped: false };
	return { value: max, clamped: true };
}

export function findUnit(press: PressMachine, screw: ScrewDiameter): InjectionUnitLimits {
	const unit = press.units.find(u => u.screwDiameter_mm === screw);
	if (!unit) throw new Error(`Missing injection unit for screw ${screw}mm on ${press.id}`);
	return unit;
}

export function getPressById(catalog: PressMachine[], id: PressId): PressMachine {
	const p = catalog.find(x => x.id === id);
	if (!p) throw new Error(`Press not found: ${id}`);
	return p;
}

export default {} as any;
