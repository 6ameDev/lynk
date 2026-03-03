import { fnv1a64 } from "../lib/utils";
import { Row, Transaction } from "../types";

type AnyRow = Record<string, any>;

export function normalizeColumns<T extends AnyRow>(rows: T[]): Record<string, any>[] {
  if (!rows.length) return [];

  return rows.map((row) => {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      const normKey = normalizeKey(key);
      normalized[normKey] = value;
    }

    return normalized;
  });
}

export function addHashes(rows: Row[], accountName: string): Row[] {
  const counter = new Map<string, number>();

  return rows.map(row => {
    if (!row.transaction) return row;

    const key = fingerprint(row.transaction, accountName);
    const count = counter.get(key) ?? 0;
    counter.set(key, count + 1);

    const transaction = { ...row.transaction, comment: `${key}#${count}` };

    return { ...row, transaction };
  });
}

// Private functions

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    // replace anything not alphanumeric with underscore
    .replace(/[^a-z0-9]+/g, "_")
    // remove leading/trailing underscores
    .replace(/^_+|_+$/g, "");
}

function fingerprint(item: Transaction, accountName: string): string {
  const cashActivityTypes = ["TAX", "WITHDRAWAL", "DEPOSIT"];

  const unitPrice = item.activityType == "Tax" ? Math.abs(item.unitPrice) : item.unitPrice;
  const symbol = cashActivityTypes.includes(item.activityType.toUpperCase())
    ? "$CASH-USD"
    : item.symbol;

  const raw = [
    accountName,
    item.date.trim(),
    item.activityType.toUpperCase(),
    symbol,
    item.quantity || 0,
    unitPrice,
    item.currency,
    item.fee,
  ].join("|");

  return fnv1a64(raw);
}
