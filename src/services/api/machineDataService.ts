// Servizio per simulare la ricezione di dati macchina reali
export interface MachineData {
  cycleTime_s: number;
  pressure_bar: number;
  temperature_C: number;
}

// Simulazione polling dati macchina
export async function fetchMachineData(): Promise<MachineData> {
  // Qui andrebbe la chiamata reale a un endpoint REST, OPC-UA, MQTT, ecc.
  // Demo: dati random
  return {
    cycleTime_s: 12.4 + Math.random() * 0.5,
    pressure_bar: 240 + Math.round(Math.random() * 5),
    temperature_C: 33 + Math.round(Math.random() * 2),
  };
}
