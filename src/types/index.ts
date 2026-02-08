export interface KuveraFund {
  name: string;
  symbol: string;
}

export interface Configs {
  kuveraFunds: KuveraFund[];
}

export interface ParsedTable {
  name?: string;
  headers: string[];
  rows: Record<string, any>[];
  rawRows: string[][];
  errors: ParserError[];
}

export interface ParsedFile {
  file: File;
  fileType: string;
  tables: ParsedTable[];
  fatalError?: ParserError;
}

export type ParserErrorType =
  | "File"
  | "Header"
  | "Row"
  | "Sheet";

export interface ParserError {
  type: ParserErrorType;
  message: string;
  row?: number;        // CSV row / XLSX row
  column?: string;
  sheetName?: string;  // XLSX only
  code?: string;
}

