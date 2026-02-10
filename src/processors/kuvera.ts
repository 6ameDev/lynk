import { Activity } from "@wealthfolio/addon-sdk";

import type { BrokerProcessor } from "./types";
import type { Configs, ParsedData, Row, Transaction } from "../types";

import { parseFile } from "../lib";
import { normalizeColumns } from "./utils";

const REQUIRED_COLUMNS = [
  "date",
  "order",
  "name_of_the_fund",
  "units",
  "nav",
  "amount_inr",
];

export const ORDER_ACTIVITY_MAP: Record<string, Activity["type"]> = {
  buy: "ADD_HOLDING",
  sell: "REMOVE_HOLDING",
};

export const kuveraProcessor: BrokerProcessor = {
  async process(configs: Configs, file: File): Promise<ParsedData> {
    const kuveraFunds = configs.kuveraFunds;
    const kuveraFundsMap = Object.fromEntries(
      kuveraFunds.map((fund) => [fund.name, fund.symbol]),
    );

    const {table, rows} = await getValidatedData(file);

    // Check if Fund Name <> Symbol mapping exists
    const fundNames = new Set(rows.map(r => r.name_of_the_fund));
    const unmapped = [...fundNames].filter(
      name => !(name in kuveraFundsMap)
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
        symbol: kuveraFundsMap[row.name_of_the_fund],
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

async function getValidatedData(file: File) {
  if(!file.name.endsWith(".csv")) {
    throw new Error("Invalid file format for Kuvera. Only CSV is supported");
  }

  const tables = await parseFile(file);
  if(tables.length < 1) {
    throw new Error("Invalid CSV File");
  }

  const table = tables[0];
  const rows = normalizeColumns(table.rawRows);

  for (const col of REQUIRED_COLUMNS) {
    if (!(col in rows[0])) {
      throw new Error(`Kuvera CSV missing required column: ${col}`);
    }
  }

  return { table, rows };
}
