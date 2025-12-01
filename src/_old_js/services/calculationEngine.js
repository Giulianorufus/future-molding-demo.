import { calculateInjection as tsCalculateInjection } from '../../services/calculationEngine.ts';
import { error as logError } from '@/lib/log';

// Archived legacy wrapper (kept for reference). Active runtime should use the TS implementation.
export function calculateInjection(params, marca, modello, material) {
    try {
        return tsCalculateInjection(params, marca, modello, material);
    } catch (e) {
        // Fallback: return a safe error result
        logError('calculationEngine.js wrapper failed delegating to TS calculateInjection', e);
        return { success: false, weight: 0, cycleTime: 0, errors: ['Errore calcolo interno'] };
    }
}
