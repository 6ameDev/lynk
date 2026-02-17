import { ActivityDetails } from "@wealthfolio/addon-sdk";
import { fnv1a64 } from "../lib";
import { Transaction } from "../types";

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

export function generateHashForActivity(activity: ActivityDetails): string {
  const amountActivityTypes = ["DIVIDEND", "WITHDRAWAL", "DEPOSIT"];
  const unitPrice = amountActivityTypes.includes(activity.activityType)
    ? activity.amount
    : activity.unitPrice;

  const raw = [
    activity.accountId,
    normalizeToISTDate(activity.date),
    activity.activityType,
    activity.assetSymbol,
    activity.quantity || 0,
    unitPrice || 0,
    activity.currency,
    activity.fee,
  ].join("|");

  return `${fnv1a64(raw)}#${0}`;
}

export function generateHash(item: Transaction, accountId: string): string {
  const cashActivityTypes = ["TAX", "WITHDRAWAL", "DEPOSIT"];
  
  const unitPrice = item.activityType == "Tax" ? Math.abs(item.unitPrice) : item.unitPrice;
  const symbol = cashActivityTypes.includes(item.activityType.toUpperCase())
    ? "$CASH-USD"
    : item.symbol;

  const raw = [
    accountId,
    item.date.trim(),
    item.activityType.toUpperCase(),
    symbol,
    item.quantity || 0,
    unitPrice,
    item.currency,
    item.fee,
  ].join("|");

  return `${fnv1a64(raw)}#${0}`;
}

function normalizeToISTDate(dateInput: string | Date): string {
  const d = new Date(dateInput);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(d);
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    // replace anything not alphanumeric with underscore
    .replace(/[^a-z0-9]+/g, "_")
    // remove leading/trailing underscores
    .replace(/^_+|_+$/g, "");
}
