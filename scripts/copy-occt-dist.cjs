// Copy occt-import-js dist artifacts into public/vendor/occt so Vite serves the wasm/worker
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const from = path.join(projectRoot, 'node_modules', 'occt-import-js', 'dist');
const to = path.join(projectRoot, 'public', 'vendor', 'occt');

if (!fs.existsSync(from)) {
  console.error('occt-import-js dist folder not found:', from);
  process.exitCode = 1;
} else {
  fs.mkdirSync(to, { recursive: true });
  const files = fs.readdirSync(from);
  for (const f of files) {
    const src = path.join(from, f);
    const dst = path.join(to, f);
    try {
      fs.copyFileSync(src, dst);
      console.log('copied', f);
    } catch (err) {
      console.error('failed to copy', src, err);
    }
  }
  console.log('occt-import-js dist copied to', to);
}
