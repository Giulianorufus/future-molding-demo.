
import { calculateInjection } from './src/services/calculationEngine';
import { getMaterials } from './src/fm-core';

// Mock data
const mockMaterial = getMaterials()[0]; // Use first available material
const mockPress = { brand: 'arburg', model: '370S_700_100' }; // Assuming this model exists
const mockParams = {
    spessore: 2.5,
    volumeCavita: 15.0,
    volumeMaterozza: 2.0,
    cushion: 5.0
};

console.log('--- Starting Calculation Debug ---');
console.log('Material:', mockMaterial?.name);
console.log('Press:', mockPress);
console.log('Params:', mockParams);

if (!mockMaterial) {
    console.error('CRITICAL: No material found!');
    process.exit(1);
}

const result = calculateInjection(
    mockParams,
    mockPress.brand,
    mockPress.model,
    mockMaterial
);

console.log('--- Result ---');
console.log(JSON.stringify(result, null, 2));

if (result.success) {
    console.log('SUCCESS: Calculation engine is working with valid inputs.');
} else {
    console.error('FAILURE: Calculation engine failed.', result.errors);
}
