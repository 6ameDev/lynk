import { Activity } from "@wealthfolio/addon-sdk";

import { getFileMeta, parseFile } from "../lib";
import { addHashes, normalizeColumns } from "./utils";
import type { BrokerProcessor, ParsedData, Row, Transaction } from "../types";

const KUVERA_ACCOUNT = "kuvera";

const REQUIRED_COLUMNS = [
  "date",
  "order",
  "name_of_the_fund",
  "units",
  "nav",
  "amount_inr",
];

type CashActivity = "DEPOSIT" | "WITHDRAWAL";

export const ORDER_ACTIVITY_MAP: Record<string, Activity["activityType"]> = {
  buy: "BUY",
  sell: "SELL",
};

const CASH_ACTIVITY_MAP: Record<string, CashActivity> = {
  buy: "DEPOSIT",
  sell: "WITHDRAWAL",
};

export const kuveraProcessor: BrokerProcessor = {
  async process({configs, file}): Promise<ParsedData> {
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

    const outputRows: Row[] = rows.flatMap((row) => {
      const order = String(row.order).trim().toLowerCase();

      if (!(order in ORDER_ACTIVITY_MAP)) {
        return [{
          error: `Unsupported Kuvera order type: ${order}`,
        }];
      }

      const quantity = Number(row.units);
      const unitPrice = Number(row.nav);
      const amount = Number(quantity * unitPrice);

      const cashTxn: Transaction = {
        date: row.date,
        activityType: CASH_ACTIVITY_MAP[order],
        symbol: "",
        quantity: null,
        unitPrice: amount,
        amount,
        currency: "INR",
        fee: 0,
      };

      const tradeTxn: Transaction = {
        date: row.date,
        activityType: ORDER_ACTIVITY_MAP[order],
        symbol: kuveraFundsMap[row.name_of_the_fund],
        quantity,
        unitPrice,
        amount,
        currency: "INR",
        fee: 0,
      };

      return [
        { transaction: tradeTxn, error: "" },
        { transaction: cashTxn, error: "" },
      ];
    });

    const sortedRows = [...outputRows].sort(({transaction: txnA}, {transaction: txnB}) => {
      if (!txnA || !txnB) return 0;
      return txnB.date.localeCompare(txnA.date);
    });

    const outputWithHashes = addHashes(sortedRows, KUVERA_ACCOUNT);

    table.rows = outputWithHashes;
    const { name, format } = getFileMeta(file);

    return {
      tables: [table],
      name,
      format,
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
