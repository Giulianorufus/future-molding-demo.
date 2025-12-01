// Utility per esportazione dati
export function exportToCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const csv = [Object.keys(rows[0]).join(",")].concat(
    rows.map(r => Object.values(r).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(filename: string, obj: any) {
  const txt = JSON.stringify(obj, null, 2);
  const blob = new Blob([txt], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
