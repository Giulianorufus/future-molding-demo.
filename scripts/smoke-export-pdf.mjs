import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// importa i file TS con estensione per funzionare con loader tsx
import { buildRecipeSnapshot } from '../src/engine/recipeExport/buildRecipeSnapshot.ts';
import { exportRecipePdf } from '../src/engine/recipeExport/exportRecipePdf.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // usa lo stesso sample usato nei test: minimale
  const sample = buildRecipeSnapshot({ projectName: 'SMOKE_TEST', input: {}, output: {} });

  const pdfBytes = await exportRecipePdf(sample);

  const outPath = path.join(__dirname, '..', 'out_smoke_recipe.pdf');
  await fs.writeFile(outPath, Buffer.from(pdfBytes));

  console.log('OK: scritto', outPath, pdfBytes?.length);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
