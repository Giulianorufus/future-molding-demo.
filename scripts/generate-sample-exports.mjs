import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRecipeSnapshot } from '../src/engine/recipeExport/buildRecipeSnapshot.ts';
import { exportRecipeJson } from '../src/engine/recipeExport/exportRecipeJson.ts';
import { exportRecipeCsv } from '../src/engine/recipeExport/exportRecipeCsv.ts';
import { exportRecipePdf } from '../src/engine/recipeExport/exportRecipePdf.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const sample = buildRecipeSnapshot({ projectName: 'SAMPLE_PROJECT', input: {}, output: {} });

  const outDir = path.join(__dirname, '..', 'samples');
  await fs.mkdir(outDir, { recursive: true });

  const json = exportRecipeJson(sample);
  await fs.writeFile(path.join(outDir, 'recipe.sample.json'), json, 'utf8');

  const csv = exportRecipeCsv(sample);
  await fs.writeFile(path.join(outDir, 'recipe.sample.csv'), csv, 'utf8');

  const pdfBytes = await exportRecipePdf(sample);
  await fs.writeFile(path.join(outDir, 'recipe.sample.pdf'), Buffer.from(pdfBytes));

  console.log('OK: written samples to', outDir);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
