import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number;
};

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
) {
  const data = rows.map((r) => {
    const obj: Record<string, string | number> = {};
    columns.forEach((c) => {
      obj[c.header] = c.accessor(r);
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPDF<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title?: string,
) {
  const doc = new jsPDF({ orientation: "landscape" });
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 14);
  }
  autoTable(doc, {
    startY: title ? 20 : 14,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(c.accessor(r) ?? ""))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [212, 168, 67] },
  });
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
