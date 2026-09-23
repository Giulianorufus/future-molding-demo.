import { test, expect } from '@playwright/test';
import path from 'path';

test('Wizard: STEP reale -> stampo, pressa, materiale -> parametri', async ({ page }) => {
  const stepPath = path.resolve(process.cwd(), 'public', 'sample-drawings', 'Frutto (1).stp');

  await page.goto('/#/wizard');

  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput, 'Il Wizard deve esporre il campo per caricare il disegno').toHaveCount(1);
  await fileInput.setInputFiles(stepPath);

  await expect(page.getByText('4.326812032516769', { exact: true })).toBeVisible();
  await expect(page.getByText('7.040000152587891', { exact: true })).toBeVisible();
  await expect(page.getByText(/17\.600000381469727 x 40 x 27\.90000057220459 mm/)).toBeVisible();

  await page.getByRole('button', { name: 'Avanti', exact: true }).click();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('combobox').selectOption('cold');
  await page.getByRole('spinbutton', { name: 'Volume materozza/canali per stampata (cm³)' }).fill('2');
  await page.getByRole('spinbutton', { name: 'Area proiettata canali (cm²)' }).fill('1');
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  const pressSelectors = page.getByRole('combobox');
  await pressSelectors.nth(0).selectOption({ label: 'ARBURG' });
  await pressSelectors.nth(1).selectOption({ label: 'Arburg 370 U' });
  await pressSelectors.nth(2).selectOption({ label: '22 mm' });
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  await page.getByRole('button', { name: /PP \(Polipropilene\)/ }).click();
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Parametri calcolati' })).toBeVisible();
  await expect(page.getByText('Dose totale stampata:')).toContainText('Dose totale stampata:');
  await expect(page.getByText('19.31 cm³', { exact: true })).toBeVisible();
});
