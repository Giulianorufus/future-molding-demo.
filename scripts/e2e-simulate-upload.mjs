import path from 'path';
import { chromium } from 'playwright';

(async () => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173/#/parametri';
  const glbPath = path.resolve(process.cwd(), 'tmp', 'Frutto (1).glb');
  console.log('Using GLB:', glbPath);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE:', msg.text()));
  try {
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    // wait for file input
    await page.waitForSelector('input[type=file]', { state: 'attached', timeout: 10000 });
    const input = await page.$('input[type=file]');
    if (!input) throw new Error('File input not found');

    // Attach file
    await input.setInputFiles(glbPath);
    console.log('File attached. Waiting for toast or analysis...');

    // Wait for toast 'Disegno caricato' or analysis text
    try {
      await page.waitForSelector('text=Disegno caricato', { timeout: 8000 });
      console.log('Toast: Disegno caricato detected');
    } catch (e) {
      console.log('Toast not detected within timeout');
    }

    // Wait for analysis text 'Analisi disegno' or results area
    try {
      await page.waitForSelector('text=Analisi disegno', { timeout: 20000 });
      const analisiElem = await page.$('text=Analisi disegno');
      const snippet = await analisiElem?.evaluate((n) => n.parentElement?.textContent) || '';
      console.log('Analisi found:', snippet.trim());
    } catch (e) {
      console.log('Analisi text not found within timeout');
    }

    // wait a moment for viewer to start loading and capture screenshot + logs
    await page.waitForTimeout(1500);
    const ssPath = path.resolve(process.cwd(), 'tmp', `e2e-snap-${Date.now()}.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
    console.log('Saved screenshot to', ssPath);

    // Select Brand -> Model -> Material to trigger auto-calc
    try {
      // Brand select
      const brandLabel = page.locator('label', { hasText: 'Brand' }).first();
      const brandSelect = brandLabel.locator('xpath=..').locator('select').first();
      const brandOptions = await brandSelect.locator('option').allTextContents();
      const brandToPick = brandOptions.includes('Arburg') ? 'Arburg' : (brandOptions.find(t => t.trim() && !t.toLowerCase().includes('seleziona')) || '');
      if (brandToPick) {
        await brandSelect.selectOption({ label: brandToPick });
        console.log('Selected brand:', brandToPick);
        // wait a bit for model options to populate
        await page.waitForTimeout(300);
        // pick first available model
        const modelLabel = page.locator('label', { hasText: 'Modello' }).first();
        const modelSelect = modelLabel.locator('xpath=..').locator('select').first();
        const modelOptions = await modelSelect.locator('option').allTextContents();
        const modelToPick = modelOptions.find(t => t.trim() && !t.toLowerCase().includes('seleziona')) || '';
        if (modelToPick) {
          await modelSelect.selectOption({ label: modelToPick });
          console.log('Selected model:', modelToPick);
        }
      }

      // Material select
      const matLabel = page.locator('label', { hasText: 'Materiale' }).first();
      const matSelect = matLabel.locator('xpath=..').locator('select').first();
      const matOptions = await matSelect.locator('option').allTextContents();
      const matToPick = matOptions.find(t => t.trim() && !t.toLowerCase().includes('seleziona')) || '';
      if (matToPick) {
        await matSelect.selectOption({ label: matToPick });
        console.log('Selected material:', matToPick);
      }

      // Wait for results panel
      await page.waitForSelector('text=Risultati', { timeout: 20000 });
      const resultsText = await page.locator('text=Risultati').first().evaluate((n) => n.parentElement?.textContent || '');
      console.log('Results panel text snippet:\n', resultsText.trim().slice(0, 800));
    } catch (e) {
      console.log('Auto-calc or UI selection failed:', e?.message || e);
    }

  } catch (err) {
    console.error('Script error:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
