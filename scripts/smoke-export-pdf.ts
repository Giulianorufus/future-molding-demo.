import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRecipeSnapshot } from "../src/engine/recipeExport/buildRecipeSnapshot";
import { exportRecipePdf } from "../src/engine/recipeExport/exportRecipePdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const snapshot = buildRecipeSnapshot({
    // input minimo “stabile” per smoke:
    // se nel tuo builder richiede campi diversi, adegua qui copiando dal test recipeExport.test.ts
    recipeId: "smoke",
    createdAtISO: new Date(0).toISOString(),
  } as any);

  const pdfBytes = await exportRecipePdf(snapshot);

  const outDir = path.resolve(__dirname, "../out");
  mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "smoke-recipe.pdf");
  writeFileSync(outPath, Buffer.from(pdfBytes));

  console.log(`OK: scritto ${outPath} (${pdfBytes.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
