import type { BrokerProcessor } from "./types";
import type { ParsedData, Row, Transaction } from "../types";

import { normalizeColumns } from "./utils";
import { Activity } from "@wealthfolio/addon-sdk";
import { parseFile } from "../hooks/use-file-parser";

export const KUVERA_FUND_MAP: Record<string, string> = {
  "HDFC Flexicap Growth Direct Plan": "0P0000XW77.BO",
  "HDFC Liquid Growth Direct Plan": "0P0000XW89.BO",
  "HDFC Money Market Growth Direct Plan": "0P0000XW6V.BO",
  "HDFC Nifty 50 Index Growth Direct Plan": "0P0000XW7T.BO",
  "ICICI Prudential Gilt Growth Direct Plan": "0P0000XUXV.BO",
  "ICICI Prudential Liquid Growth Direct Plan": "0P0000XUYC.BO",
  "ICICI Prudential Money Market Growth Direct Plan": "0P0000XUYQ.BO",
  "Parag Parikh Dynamic Asset Allocation Growth Direct Plan": "0P0001SEJL.BO",
  "Parag Parikh Flexi Cap Growth Direct Plan": "0P0000YWL1.BO",
  "SBI Gilt Growth Direct Plan": "0P0000XVK2.BO",
  "UTI Nifty 50 Index Growth Direct Plan": "0P0000XVU2.BO",
  "UTI Nifty Next 50 Index Growth Direct Plan": "0P0001DI4I.BO",
  "Kotak Arbitrage Growth Direct Plan": "0P0000XV5S.BO",
  "Tata Arbitrage Growth Direct Plan": "0P0001F9YJ.BO",
};

export const ORDER_ACTIVITY_MAP: Record<string, Activity["type"]> = {
  buy: "ADD_HOLDING",
  sell: "REMOVE_HOLDING",
};

export const kuveraProcessor: BrokerProcessor = {
  canHandle(file) {
    return file.name.endsWith(".csv");
  },

  async process(file): Promise<ParsedData> {
    const tables = await parseFile(file);
    if(tables.length < 1) {
      throw new Error("Invalid CSV File");
    }

    const table = tables[0];
    const rows = normalizeColumns(table.rawRows);

    const requiredCols = [
      "date",
      "order",
      "name_of_the_fund",
      "units",
      "nav",
      "amount_inr",
    ];

    for (const col of requiredCols) {
      if (!(col in rows[0])) {
        throw new Error(`Kuvera CSV missing required column: ${col}`);
      }
    }

    // ---- Symbol mapping validation ----
    const fundNames = new Set(rows.map(r => r.name_of_the_fund));
    const unmapped = [...fundNames].filter(
      name => !(name in KUVERA_FUND_MAP)
    );

    if (unmapped.length) {
      throw new Error(
        `Missing symbol mappings for Kuvera funds:\n${unmapped
          .map(n => `- ${n}`)
          .join("\n")}`
      );
    }

    const output: Row[] = rows.map(row => {
      const order = String(row.order).trim().toLowerCase();

      if (!(order in ORDER_ACTIVITY_MAP)) {
        return {
          error: `Unsupported Kuvera order type: ${order}`
        }
      }

      const txn: Transaction = {
        date: row.date,
        activityType: ORDER_ACTIVITY_MAP[order],
        symbol: KUVERA_FUND_MAP[row.name_of_the_fund],
        quantity: Number(row.units),
        unitPrice: Number(row.nav),
        amount: Number(row.amount_inr),
        currency: "INR",
        fee: 0,
      };

      return {
        transaction: txn,
        error: ""
      }
    });

    table.rows = output;

    return {
      tables: [table],
      format: "csv",
      error: ""
    }
  },
}
