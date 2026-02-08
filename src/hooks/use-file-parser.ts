import * as XLSX from "xlsx";
import Papa from "papaparse";

import { ParsedFile, ParsedTable } from "../types";
import { useState } from "react";

type SupportedFileType = "csv" | "xlsx";

function detectFileType(file: File): SupportedFileType | null {
  if (file.name.endsWith(".csv")) return "csv";
  if (file.name.endsWith(".xlsx")) return "xlsx";
  return null;
}

function validateHeaders(headers: string[]): boolean {
  return (
    headers.length >= 3 &&
    !headers.some((header) => !header || header.trim() === "")
  );
}


export function useFileParser() {
  const [state, setState] = useState<ParsedFile | null>(null);

  const parseFile = async (file: File) => {
    setState({
      file,
      tables: [],
      isParsing: true,
    });

    try {
      const type = detectFileType(file);
      if (!type) {
        throw new Error("Unsupported file type");
      }

      let tables: ParsedTable[];

      if (type === "csv") {
        const table = await parseCsv(file);
        tables = [table];
      } else {
        tables = await parseXlsx(file);
      }

      setState({
        file,
        tables,
        isParsing: false,
      });
    } catch (err: any) {
      setState({
        file,
        tables: [],
        isParsing: false,
        fatalError: err,
      });
    }
  };

  return {
    tables: state?.tables,
    isParsing: state?.isParsing,
    errors: state?.fatalError,
    selectedFile: state?.file || null,
    parseFile,
    resetFileParser: () => setState(null),
  };
}

function parseCsv(file: File): Promise<ParsedTable> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data;

        if (!rawRows.length) {
          return reject({
            type: "File",
            message: "CSV file is empty",
            row: 0,
          });
        }

        const headers = rawRows[0].map(h => h.trim());

        if (!validateHeaders(headers)) {
          return reject({
            type: "Header",
            message: "Invalid CSV headers",
            row: 0,
          });
        }

        const rows = rawRows.slice(1).map((row, i) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx]?.trim?.() ?? "";
          });
          return obj;
        });

        resolve({
          name: "Sheet1",
          headers,
          rows,
          rawRows,
          errors: [],
        });
      },
      error: reject,
    });
  });
}

function parseXlsx(file: File): Promise<ParsedTable[]> {
  return file.arrayBuffer().then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });

    return workbook.SheetNames.map(sheetName => {
      const sheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        blankrows: false,
      });

      if (!rawRows.length) {
        return {
          name: sheetName,
          headers: [],
          rows: [],
          rawRows: [],
          errors: [],
        };
      }

      const headers = rawRows[0].map(h => String(h).trim());
      const rows = rawRows.slice(1).map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] ?? "";
        });
        return obj;
      });

      return {
        name: sheetName,
        headers,
        rows,
        rawRows: rawRows.map(r => r.map(String)),
        errors: [],
      };
    });
  });
}
