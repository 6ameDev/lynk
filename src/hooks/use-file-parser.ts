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
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const parseFile = async (file: File) => {
    setIsParsing(true);
    setParsedFile({
      file,
      fileType: "",
      tables: [],
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

      setIsParsing(false);
      setParsedFile({
        file,
        fileType: type,
        tables,
      });
    } catch (err: any) {
      setIsParsing(false);
      setParsedFile({
        file,
        fileType: "",
        tables: [],
        fatalError: err,
      });
    }
  };

  return {
    fileType: parsedFile?.fileType,
    tables: parsedFile?.tables,
    isParsing: isParsing,
    errors: parsedFile?.fatalError,
    selectedFile: parsedFile?.file || null,
    parseFile,
    resetFileParser: () => setParsedFile(null),
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
