import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/exportUtils";

type Props<T> = {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  exportRows: T[];
  exportColumns: ExportColumn<T>[];
  exportFilename: string;
  exportTitle?: string;
};

export function TableToolbar<T>({
  search,
  onSearchChange,
  placeholder = "Search...",
  exportRows,
  exportColumns,
  exportFilename,
  exportTitle,
}: Props<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToExcel(exportRows, exportColumns, exportFilename)}
        disabled={exportRows.length === 0}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToPDF(exportRows, exportColumns, exportFilename, exportTitle)}
        disabled={exportRows.length === 0}
      >
        <FileText className="h-4 w-4 mr-2" /> PDF
      </Button>
    </div>
  );
}
