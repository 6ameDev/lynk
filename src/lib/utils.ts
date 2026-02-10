import { TableRow } from "../components/table-viewer";
import { Row, Transaction, TRANSACTION_HEADERS } from "../types";

export const getFileMeta = (file: File) => {
  const [name, format = ""] = file.name.split(/\.(?=[^\.]+$)/);
  return { name, format: format.toLowerCase() };
};

export function toCsv(rows: Row[]): string {
  if (!rows.length) return "";

  const lines = [
    TRANSACTION_HEADERS.join(","),
    ...rows.map(row => {
      const { transaction, error } = row;

      if (!transaction) return "";

      return TRANSACTION_HEADERS.map(h => escapeCsvValue(transaction[h])).join(",");
    }),
  ];

  return lines.join("\n");
}

export function toTableViewerRows(rows: Row[]): TableRow[] {
  const headerContent = TRANSACTION_HEADERS.join(",");
  const headerRow = {
    id: 0,
    content: headerContent,
    isValid: true,
  }

  const dataRows: TableRow[] = rows.map((row, index) => {
    const { transaction, error } = row;
    const lineNumber = index;
    const content = transaction ? transactionToCsvRows(transaction) : "";

    return {
      id: lineNumber,
      content: content,
      isValid: error.length === 0,
      errors: error.length ? [error] : undefined,
    };
  });

  return [headerRow, ...dataRows];
}

function transactionToCsvRows(transaction: Transaction): string {
  return TRANSACTION_HEADERS
    .map((key) => escapeCsvValue(transaction[key]))
    .join(",");
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  // Escape if value contains comma, quote, or newline
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
