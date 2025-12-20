import { buildRecipeSnapshot } from '../recipeExport/buildRecipeSnapshot';
import { exportRecipeJson } from '../recipeExport/exportRecipeJson';
import { exportRecipeCsv } from '../recipeExport/exportRecipeCsv';
import { exportRecipePdf } from '../recipeExport/exportRecipePdf';

describe('recipe export', () => {
  test('json snapshot contains versions and ISO timestamp', () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const json = exportRecipeJson(snap);
    const obj = JSON.parse(json);
    expect(obj.meta).toBeDefined();
    expect(obj.meta.materialsVersion).toBeDefined();
    expect(obj.meta.pressCatalogVersion).toBeDefined();
    expect(typeof obj.meta.timestampISO).toBe('string');
    expect(obj.meta.timestampISO).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('csv header order and separator', () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const csv = exportRecipeCsv(snap);
    const lines = csv.trim().split('\n');
    expect(lines[0].includes(';')).toBe(true);
    expect(lines[0].startsWith('projectName;')).toBe(true);
  });

  test('pdf smoke: generates bytes starting with %PDF', async () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const bytes = await exportRecipePdf(snap);
    const prefix = String.fromCharCode(...bytes.slice(0,4));
    expect(prefix).toBe('%PDF');
  });
});
