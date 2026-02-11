import { parseFile } from "../lib";
import { Configs, ParsedData, Row, Transaction } from "../types";
import { BrokerProcessor } from "./types";
import { normalizeColumns } from "./utils";

const SHEET_SPECS = {
  Trades: {
    columns: [
      "date",
      "time_in_utc",
      "name",
      "ticker",
      "activity",
      "order_type",
      "quantity",
      "price_per_share_in_usd",
      "cash_amount_in_usd",
      "commission_charges_in_usd",
    ],
    activityMap: {
      "Buy": "BUY",
      "Sell": "SELL",
    }
  }, 

  Transfers: {
    columns: [
      "date",
      "time_in_utc",
      "activity",
      "cash_amount_in_usd",
    ],
    activityMap: {
      "Deposit": "Deposit",
      "Vested Direct Deposit": "Deposit",
      "Deposit Reversal": "Withdrawal",
    }
  },

  Income: {
    columns: [
      "date",
      "time_in_utc",
      "activity",
      "ticker",
      "gross_cash_amount_in_usd",
    ],
    activityMap: {
      "Tax": "Tax",
      "Dividend": "Dividend"
    }
  }
} as const;

type Result = {
  rows?: Row[];
  errors?: string[];
};

export const vestedProcessor: BrokerProcessor = {
  async process(configs: Configs, file: File): Promise<ParsedData> {
    if(!file.name.endsWith(".xlsx")) {
      throw new Error("Invalid file format for Vested. Only XLSX is supported");
    }

    const tables = await parseFile(file);
    if(tables.length < 1) {
      throw new Error("Invalid XLSX File");
    }

    const processedTables = tables.map((table) => {
      const rows = normalizeColumns(table.rawRows);
      const missing = validateSheetColumns(table.name, rows[0]);

      if (missing) {
        const missingColumns = missing.join(", ");
        throw new Error(`${table.name} sheet in Vested XLSX file is missing columns: ${missingColumns}`);
      }

      const result = processSheet(table.name, rows);
      if (result.errors) {
        throw new Error(`Unsupported Vested ${table.name} activities: ${[...result.errors].join(", ")}`);
      }

      table.rows = result.rows ?? [];
      return table;
    })
    .filter(table => table.rows.length > 0);

    return {
      tables: processedTables,
      format: "xlsx",
      error: ""
    };
  }
}

function validateSheetColumns(sheetName: string, actualColumns: Record<string, any>): string[] | null {
  const sheetSpec = SHEET_SPECS[sheetName as keyof typeof SHEET_SPECS];

  // Sheet not in map → ignore
  if (!sheetSpec) return null;
  
  // Verify columns exist
  const requiredColumns = sheetSpec.columns;
  const missing = requiredColumns.filter(
    (col) => !Object.keys(actualColumns).includes(col),
  );

  return missing.length > 0 ? missing : null;
}

function processSheet(sheetName: string, rows: Record<string, any>[]): Result {
  const sheetSpec = SHEET_SPECS[sheetName as keyof typeof SHEET_SPECS];

  // Sheet not in map → ignore
  if (!sheetSpec) return {};

  // Verify activities are supported
  const invalid = new Set(
    rows
      .map(row => String(row.activity || "").trim())
      .filter(activity => !(activity in sheetSpec.activityMap))
  );

  if (invalid.size) return { errors: Array.from(invalid) };

  const outputRows = rows.map(r => ({
    transaction: {
      date: new Date(r.date).toISOString().slice(0, 10),
      activityType: sheetSpec.activityMap[r.activity as keyof typeof sheetSpec.activityMap],
      symbol: r.ticker ?? "",
      quantity: r.quantity ? Number(r.quantity) : null,
      unitPrice: Number(r.price_per_share_in_usd ?? r.cash_amount_in_usd ?? r.gross_cash_amount_in_usd),
      amount: Number(r.cash_amount_in_usd ?? r.gross_cash_amount_in_usd),
      currency: "USD",
      fee: Number(r.commission_charges_in_usd ?? 0),
    },
    error: ""
  }));

  return { rows: outputRows };
}
