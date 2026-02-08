import { Account, ActivityType } from "@wealthfolio/addon-sdk";
import { Button, Icons, ProgressIndicator } from "@wealthfolio/ui";
import { ImportAlert } from "../components/import-alert";
import { TableRow, TableViewer } from "../components/table-viewer";
import { ParserError } from "../types";

interface ReviewStepProps {
  fileType: string;
  tableName?: string;
  headers: string[];
  rows: Record<string, any>[];
  account: Account;
  activityTypes: ActivityType[];
  onNext: () => void;
  onBack: () => void;
}

export const ReviewStep = ({
  fileType,
  tableName,
  headers,
  rows,
  account,
  activityTypes,
  onBack,
  onNext,
}: ReviewStepProps) => {
  function groupErrorsByRow(errors: ParserError[] = []) {
    const map = new Map<number, ParserError[]>();

    for (const err of errors) {
      if (err.row == null) continue;
      const list = map.get(err.row) ?? [];
      list.push(err);
      map.set(err.row, list);
    }

    return map;
  }

  function toFileViewerRows(
    headers: string[],
    rows: Record<string, any>[],
    errors: ParserError[] = []
  ): TableRow[] {
    const errorsByRow = groupErrorsByRow(errors);

    // ---- Header row (row 1) ----
    const headerRow: TableRow = {
      id: 0,
      content: headers.join(","),
      isValid: true,
    };

    // ---- Data rows (row 2+) ----
    const dataRows: TableRow[] = rows.map((row, index) => {
      const lineNumber = index + 1; // header = 0
      const rowErrors = errorsByRow.get(lineNumber) ?? [];

      return {
        id: lineNumber,
        content: headers
          .map((h) => String(row[h] ?? ""))
          .join(","),
        isValid: rowErrors.length === 0,
        errors: rowErrors.length
          ? rowErrors.map((e) => e.message)
          : undefined,
      };
    });

    return [headerRow, ...dataRows];
  }

  const tableData = toFileViewerRows(headers, rows, []);

  return (
    <div>
      <div className="mb-4">
        <TableViewer name={tableName} data={tableData} fileType={fileType} className="w-full" maxHeight="30vh" />
      </div>

      {/* Row 3: Action buttons */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={false}>
          Back
        </Button>
        <Button onClick={onNext} disabled={false}>
          {false ? "Validating..." : "Next"}
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Loading indicator */}
      <ProgressIndicator
        title="Reading the file"
        description="Please wait while the application processes your data."
        message="Reading the file..."
        isLoading={false}
        open={false}
      />
    </div>
  );
}