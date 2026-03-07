import { getFileMeta, parseFile } from "../lib";
import { BrokerProcessor, ParsedData, Row, Transaction } from "../types";
import { addHashes, normalizeColumns } from "./utils";

const ZERODHA_ACCOUNT = "zerodha";

const ACTIVITY_MAP: Record<string, string> = {
  buy: "BUY",
  sell: "SELL",
};

const EXCHANGE_MAP: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
};

const REQUIRED_COLUMNS = [
  "symbol",
  "trade_date",
  "exchange",
  "trade_type",
  "quantity",
  "price",
];

export const zerodhaProcessor: BrokerProcessor = {
  async process({ file, configs }): Promise<ParsedData> {
    if (!file.name.endsWith(".csv")) {
      throw new Error("Invalid file format for Zerodha. Only CSV is supported");
    }

    const tables = await parseFile(file);
    if (tables.length < 1) {
      throw new Error("Invalid Zerodha CSV File");
    }

    const table = tables[0];
    const rawRows = table.rawRows;

    const rows = normalizeColumns(rawRows);

    if (rows.length > 0) {
      for (const col of REQUIRED_COLUMNS) {
        if (!(col in rows[0])) {
          throw new Error(`Zerodha file missing required column: ${col}`);
        }
      }
    }

    const sessionSymbolMap: Record<string, string> = {};
    const existingMap = configs.zerodhaSymbolMap || {};

    const outputRows: Row[] = rows.flatMap((row) => {
      const tradeTypeRaw = String(row.trade_type || "").trim().toLowerCase();
      const exchangeRaw = String(row.exchange || "").trim().toUpperCase();
      const symbolRaw = String(row.symbol || "").trim().toUpperCase();
      const dateRaw = String(row.trade_date || "").trim();
      const quantity = Number(row.quantity);
      const unitPrice = Number(row.price);

      // 1. Validate activity types
      if (!tradeTypeRaw) return [];

      if (!(tradeTypeRaw in ACTIVITY_MAP)) {
        if (symbolRaw || dateRaw) {
          return [{ error: `Unsupported or missing Zerodha trade type: ${tradeTypeRaw}` }];
        }
        return [];
      }

      // 2. Validate exchange
      if (!(exchangeRaw in EXCHANGE_MAP)) {
        return [{ error: `Unsupported or missing Zerodha exchange: ${exchangeRaw}` }];
      }

      // 3. Validate other mandatory fields
      if (!symbolRaw) return [{ error: "Missing Zerodha symbol" }];
      if (!dateRaw) return [{ error: "Missing Zerodha trade date" }];
      if (isNaN(quantity)) return [{ error: `Invalid Zerodha quantity: ${row.quantity}` }];
      if (isNaN(unitPrice)) return [{ error: `Invalid Zerodha price: ${row.price}` }];

      // 4. Validate date
      const date = new Date(dateRaw);
      if (isNaN(date.getTime())) {
        return [{ error: `Invalid Zerodha date format: ${dateRaw}` }];
      }

      // 5. Persistent Symbol Mapping
      let suffix = existingMap[symbolRaw] || sessionSymbolMap[symbolRaw];
      if (!suffix) {
        suffix = EXCHANGE_MAP[exchangeRaw];
        sessionSymbolMap[symbolRaw] = suffix;
      }

      const symbol = symbolRaw + suffix;
      const amount = quantity * unitPrice;
      const isoDate = date.toISOString().slice(0, 10);

      const tradeTxn: Transaction = {
        date: isoDate,
        activityType: ACTIVITY_MAP[tradeTypeRaw],
        symbol,
        quantity,
        unitPrice,
        amount,
        currency: "INR",
        fee: 0,
      };

      const cashTxn: Transaction = {
        date: isoDate,
        activityType: tradeTypeRaw === "buy" ? "DEPOSIT" : "WITHDRAWAL",
        symbol: "",
        quantity: null,
        unitPrice: amount,
        amount,
        currency: "INR",
        fee: 0,
      };

      return [
        { transaction: tradeTxn, error: "" },
        { transaction: cashTxn, error: "" },
      ];
    });

    const sortedRows = [...outputRows].sort(({ transaction: txnA }, { transaction: txnB }) => {
      if (!txnA || !txnB) return 0;
      return txnB.date.localeCompare(txnA.date);
    });

    const outputWithHashes = addHashes(sortedRows, ZERODHA_ACCOUNT);

    table.rows = outputWithHashes;
    const { name, format } = getFileMeta(file);

    const updatedConfigs = Object.keys(sessionSymbolMap).length > 0
      ? { zerodhaSymbolMap: { ...configs.zerodhaSymbolMap, ...sessionSymbolMap } }
      : undefined;

    return {
      tables: [table],
      name,
      format,
      error: "",
      updatedConfigs,
    };
  },
};
