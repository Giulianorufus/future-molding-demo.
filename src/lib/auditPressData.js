export const AUDIT_PRESSES = [
    {
        id: "series-170",
        uiLabel: "Serie 170",
        models: [
            { id: "170-18", label: "170 • vite 18", clampForce_t: 50, screwDiameter_mm: 18, shotVolume_cm3: 50 },
            { id: "170-25", label: "170 • vite 25", clampForce_t: 50, screwDiameter_mm: 25, shotVolume_cm3: 95 },
        ],
    },
    {
        id: "series-370",
        uiLabel: "Serie 370",
        models: [
            { id: "370-25", label: "370 • vite 25", clampForce_t: 100, screwDiameter_mm: 25, shotVolume_cm3: 120 },
            { id: "370-30", label: "370 • vite 30", clampForce_t: 100, screwDiameter_mm: 30, shotVolume_cm3: 170 },
        ],
    },
    {
        id: "series-470",
        uiLabel: "Serie 470",
        models: [
            { id: "470-30", label: "470 • vite 30", clampForce_t: 150, screwDiameter_mm: 30, shotVolume_cm3: 200 },
            { id: "470-40", label: "470 • vite 40", clampForce_t: 150, screwDiameter_mm: 40, shotVolume_cm3: 320 },
        ],
    },
];
export const getAuditPressById = (id) => AUDIT_PRESSES.find(p => p.id === id);
export const getAuditModelsForPress = (pressId) => getAuditPressById(pressId)?.models ?? [];
export const getAuditModelById = (pressId, modelId) => getAuditModelsForPress(pressId).find(m => m.id === modelId);
