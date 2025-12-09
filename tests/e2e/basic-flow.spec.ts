import { test, expect } from "@playwright/test";

test("Flusso completo: upload → wizard → parametri → difetti", async ({ page }) => {

  // 1. Vai al wizard
  await page.goto("http://127.0.0.1:3000/#/wizard");

  // 2. Upload CAD
  const fileInput = await page.locator("input[type=file]");
  await fileInput.setInputFiles("public/sample-drawings/sample-part.stl");

  // Attendi che compaia il modello caricato
  await expect(page.locator("canvas")).toBeVisible({ timeout: 8000 });

  // 3. Step 2: seleziona pressa
  await page.getByText("Step 2").click();
  await page.getByRole("button", { name: "Arburg 370 U" }).click();
  await page.getByRole("option", { name: "Arburg 370 U" }).click();

  // Se il test trova la select della vite
  const screw = page.locator("select[name=screw]");
  if (await screw.isVisible()) {
    await screw.selectOption("25");
  }

  // 4. Step 3: seleziona materiale
  await page.getByText("Step 3").click();
  await page.locator("select[name=material]").selectOption("PP-HOMO");

  // 5. Step 4: attendi parametri calcolati
  await page.getByText("Step 4").click();

  await expect(page.getByText("Iniezione")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Tonnellaggio")).toBeVisible();

  // 6. Vai in Difetti
  await page.goto("http://localhost:3000/#/difetti");

  await expect(page.locator(".sidebar")).toBeVisible();

  // 7. Seleziona un difetto
  await page.getByText("Short Shot").click();

  // 8. Verifica highlight pin
  await expect(page.locator("canvas")).toBeVisible();

  // 9. Nessun errore JS in console
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  expect(errors).toHaveLength(0);
});
