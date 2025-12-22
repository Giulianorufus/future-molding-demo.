import { test, expect } from "@playwright/test";
import path from "node:path";

const BASE_URL = process.env.PW_BASE_URL || "http://127.0.0.1:5173";

test("import production CSV populates case store and similar cases appear on /parametri", async ({ page }) => {
  const csvPath = path.resolve(process.cwd(), "scripts/dev/fixtures_production.csv");

  // 1) Import
  await page.goto(`${BASE_URL}/raccolta-dati`, { waitUntil: "domcontentloaded" });

  // input file: prendi il primo file input nella pagina (robusto, poi lo rendiamo data-testid)
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toBeVisible();

  await fileInput.setInputFiles(csvPath);

  // Se la pagina mostra un feedback tipo "Importati X", verifica che compaia qualcosa di coerente
  await expect(page.getByText(/importat/i)).toBeVisible();

  // 2) Vai a Parametri
  await page.goto(`${BASE_URL}/parametri`, { waitUntil: "domcontentloaded" });

  // Verifica che i fingerprint importati compaiano nel pannello "Casi simili"
  await expect(page.getByText("fp-ABS-001")).toBeVisible();
  await expect(page.getByText("fp-PP-002")).toBeVisible();

  // Assicurati che i dev-seed non compaiano (se il progetto mostra un marker, altrimenti ignora)
  await expect(page.getByText(/dev seed/i)).toHaveCount(0);
});
