// src/engine/recipeExport/exportRecipePdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { RecipeSnapshot } from './recipeTypes';

export async function exportRecipePdf(snapshot: RecipeSnapshot): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleSize = 16;
  const textSize = 10;

  // Header
  page.drawText('Future Molding - Recipe', { x: 40, y: height - 50, size: titleSize, font, color: rgb(0.02, 0.2, 0.6) });

  page.drawText(`Project: ${snapshot.meta.projectName ?? '-'} `, { x: 40, y: height - 80, size: textSize, font });
  page.drawText(`Timestamp: ${snapshot.meta.timestampISO}`, { x: 40, y: height - 95, size: textSize, font });
  page.drawText(`AppVersion: ${snapshot.meta.appVersion}`, { x: 40, y: height - 110, size: textSize, font });
  page.drawText(`PressCatalog: ${snapshot.meta.pressCatalogVersion}`, { x: 40, y: height - 125, size: textSize, font });
  page.drawText(`Materials: ${snapshot.meta.materialsVersion}`, { x: 40, y: height - 140, size: textSize, font });

  // Parameters table start
  let y = height - 170;
  page.drawText('Press', { x: 40, y, size: 12, font });
  y -= 14;
  page.drawText(`id: ${snapshot.press?.id ?? ''}`, { x: 60, y, size: textSize, font });
  y -= 12;
  page.drawText(`model: ${snapshot.press?.model ?? ''}`, { x: 60, y, size: textSize, font });
  y -= 12;
  page.drawText(`screw mm: ${snapshot.press?.screwDiameter_mm ?? ''}`, { x: 60, y, size: textSize, font });

  y -= 18;
  page.drawText('Material', { x: 40, y, size: 12, font });
  y -= 14;
  page.drawText(`id: ${snapshot.material?.id ?? ''}`, { x: 60, y, size: textSize, font });
  y -= 12;
  page.drawText(`name: ${snapshot.material?.name ?? ''}`, { x: 60, y, size: textSize, font });

  y -= 18;
  page.drawText('Key Outputs', { x: 40, y, size: 12, font });
  y -= 14;
  const out = snapshot.output || {};
  const keys = ['shotVolumeCm3', 'injectionSpeedCm3s', 'holdingPressureBar', 'clampForceTon', 'coolingTimeSec'];
  for (const k of keys) {
    page.drawText(`${k}: ${String(out[k] ?? (k === 'shotVolumeCm3' ? snapshot.input?.shotVolumeCm3 : '') ?? '')}`, { x: 60, y, size: textSize, font });
    y -= 12;
  }

  y -= 8;
  page.drawText('Warnings / Assumptions', { x: 40, y, size: 12, font });
  y -= 14;
  const notes = [...(snapshot.warnings || []), ...(snapshot.assumptions || [])];
  for (const n of notes.slice(0, 8)) {
    page.drawText(`- ${n}`, { x: 60, y, size: 9, font });
    y -= 10;
  }

  y -= 10;
  page.drawText('Defect Audit', { x: 40, y, size: 12, font });
  y -= 14;
  if (snapshot.defect?.audit) {
    for (const a of snapshot.defect.audit.slice(0, 8)) {
      page.drawText(`- ${a}`, { x: 60, y, size: 9, font });
      y -= 10;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
