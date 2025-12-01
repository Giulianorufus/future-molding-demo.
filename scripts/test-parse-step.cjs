// Test parser STEP using occt-import-js (CommonJS)
const fs = require('fs');
const path = require('path');
const { importSTEP } = require('occt-import-js');

async function run(filePath) {
  try {
    console.log('Reading file:', filePath);
    const buf = fs.readFileSync(filePath);
    const arr = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    console.log('Calling importSTEP... (this may take a few seconds)');
    const shape = await importSTEP(arr);
    console.log('importSTEP returned:', typeof shape);
    try {
      if (shape && typeof shape.getVolume === 'function') {
        console.log('getVolume():', shape.getVolume());
      }
      if (shape && typeof shape.getArea === 'function') {
        console.log('getArea():', shape.getArea());
      }
    } catch (inner) {
      console.warn('Error calling shape methods:', inner);
    }
    // Dump keys
    try {
      console.log('Shape keys:', Object.keys(shape || {}));
    } catch (e) {
      console.warn('Could not enumerate shape keys', e);
    }
    console.log('Done.');
  } catch (err) {
    console.error('Parsing failed:', err);
    process.exit(1);
  }
}

const src = path.resolve(process.cwd(), 'public', 'sample-drawings', 'Frutto (1).stp');
run(src);
