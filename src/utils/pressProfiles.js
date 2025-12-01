// utils/pressProfiles.ts
// Modalità "stealth": NON tocca markup/CSS. Nessuna visibilità condizionata.
// Fa solo:
// 1) Prefill dei valori coerenti con la pressa selezionata
// 2) Override opzionale di etichette/unità (senza cambiare struttura)
// ⚠️ ESEMPI: sostituisci quando vuoi con i tuoi modelli reali.
// NON nascondiamo nulla: se una pressa non usa un campo, semplicemente non
// forniamo default/override; il campo resta visivamente identico.
export const PRESS_PROFILES = {
    "Arburg 170U": {
        fields: {
            p_commutazione_cm3: { key: "p_commutazione_cm3", default: 8 },
            v_iniezione_cm3s: { key: "v_iniezione_cm3s", default: 25 },
            p_iniezione_bar: { key: "p_iniezione_bar", default: 900 },
            p_mantenimento_bar: { key: "p_mantenimento_bar", default: 500 },
            tempo_mantenimento_s: { key: "tempo_mantenimento_s", default: 6 },
            contropress_bar: { key: "contropress_bar", default: 50 },
            velocita_carica_rpm: { key: "velocita_carica_rpm", default: 120 },
            risucchio_post_carica_mm: { key: "risucchio_post_carica_mm", default: 1.0 },
            temp_cilindro_C: { key: "temp_cilindro_C", default: 230 },
            temp_stampo_C: { key: "temp_stampo_C", default: 45 },
            tempo_raffreddamento_s: { key: "tempo_raffreddamento_s", default: 12 },
            forza_chiusura_t: { key: "forza_chiusura_t", default: 170 },
            note_logica: { key: "note_logica", default: "Commutazione precoce; risucchio basso; raffreddamento breve" }
        },
        notes: "Cilindro piccolo: prediligi commutazione anticipata."
    },
    "Arburg 370U": {
        fields: {
            p_commutazione_cm3: { key: "p_commutazione_cm3", default: 22 },
            v_iniezione_cm3s: { key: "v_iniezione_cm3s", default: 40 },
            p_iniezione_bar: { key: "p_iniezione_bar", default: 1400 },
            p_mantenimento_bar: { key: "p_mantenimento_bar", default: 800 },
            tempo_mantenimento_s: { key: "tempo_mantenimento_s", default: 8 },
            // Esempio override di etichetta/unità (se ti serve, altrimenti ometti)
            velocita_carica_rpm: { key: "velocita_carica_rpm", default: 150, labelOverride: "Velocità carica (vite)", unitOverride: "rpm" },
            temp_cilindro_C: { key: "temp_cilindro_C", default: 240 },
            temp_stampo_C: { key: "temp_stampo_C", default: 55 },
            tempo_raffreddamento_s: { key: "tempo_raffreddamento_s", default: 18 },
            forza_chiusura_t: { key: "forza_chiusura_t", default: 700 },
            note_logica: { key: "note_logica", default: "Mantenimento alto; raffreddamento standard" }
        },
        notes: "Cilindro più grande: puoi aumentare la velocità d'iniezione."
    }
};
// Applica profilo pressa → prefill + override etichette/unità. NIENTE UI CHANGE.
export function applyPressProfile(pressName, setFormData) {
    const prof = PRESS_PROFILES[pressName];
    if (!prof)
        return;
    const next = {};
    // Prefill valori default
    Object.values(prof.fields).forEach((f) => {
        if (!f)
            return;
        if (typeof f.default !== "undefined")
            next[f.key] = f.default;
        if (f.labelOverride || f.unitOverride) {
            next._labelUnitOverrides = next._labelUnitOverrides || {};
            next._labelUnitOverrides[f.key] = {
                label: f.labelOverride,
                unit: f.unitOverride
            };
        }
    });
    // Valori fissi/derivati
    if (prof.fixed) {
        Object.entries(prof.fixed).forEach(([k, v]) => (next[k] = v));
    }
    // Nota generale se non esiste un campo dedicato
    if (prof.notes && typeof next["note_logica"] === "undefined") {
        next["note_logica"] = prof.notes;
    }
    setFormData((prev) => ({
        ...prev,
        ...next,
        _labelUnitOverrides: {
            ...(prev?._labelUnitOverrides || {}),
            ...(next._labelUnitOverrides || {})
        }
    }));
}
// Recupera etichetta/unità per un campo, con fallback
export function getLabelUnit(formData, key, fallbackLabel, fallbackUnit) {
    const ov = formData?._labelUnitOverrides?.[key];
    return {
        label: ov?.label || fallbackLabel,
        unit: ov?.unit || fallbackUnit
    };
}
