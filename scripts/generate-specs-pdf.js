// Simple generator: read docs/specifications.md, convert markdown to text and write a PDF
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const MarkdownIt = require('markdown-it');
const { htmlToText } = require('html-to-text');

const mdPath = path.resolve(__dirname, '..', 'docs', 'specifications.md');
const outPath = path.resolve(__dirname, '..', 'docs', 'specifications.pdf');

async function generate() {
  if (!fs.existsSync(mdPath)) {
    console.error('File specifications.md non trovato in docs/');
    process.exit(1);
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  const mdParser = new MarkdownIt({ html: true });
  const html = mdParser.render(md);
  const text = htmlToText(html, { wordwrap: 130 });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // Simple text layout
  const lines = text.split('\n');
  doc.font('Helvetica').fontSize(11);
  for (const line of lines) {
    doc.text(line, { lineGap: 3 });
  }

  doc.end();
  await new Promise((res) => stream.on('finish', res));
  console.log('PDF generato in', outPath);
}

generate().catch((e) => {
  console.error('Errore generazione PDF:', e);
  process.exit(1);
});
