import * as XLSX from "xlsx";
import Papa from "papaparse";

import { Table } from "../types";

type SupportedFileType = "csv" | "xlsx";

function detectFileType(file: File): SupportedFileType | null {
  if (file.name.endsWith(".csv")) return "csv";
  if (file.name.endsWith(".xlsx")) return "xlsx";
  return null;
}

export async function parseFile(file: File) {
  try {
    const type = detectFileType(file);
    if (!type) {
      throw new Error("Unsupported file type");
    }

    let tables: Table[];

    if (type === "csv") {
      const table = await parseCsv(file);
      tables = [table];
    } else {
      tables = await parseXlsx(file);
    }
    return tables;
  } catch (err: any) {
    throw err;
  }
}

function parseCsv(file: File): Promise<Table> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data;

        resolve({
          name: "Default",
          rows: [],
          rawRows: rawRows,
          error: ""
        });
      },
      error: reject,
    });
  });
}

function parseXlsx(file: File): Promise<Table[]> {
  return file.arrayBuffer().then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });

    return workbook.SheetNames.map(sheetName => {
      const sheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        header: 1,
        blankrows: false,
      });

      return {
        name: sheetName,
        rows: [],
        rawRows: rawRows,
        error: ""
      };
    });
  });
}
