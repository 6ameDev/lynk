import { Row, Transaction, TRANSACTION_HEADERS } from "../types";

export const getFileMeta = (file: File) => {
  const [name, format = ""] = file.name.split(/\.(?=[^\.]+$)/);
  return { name, format: format.toLowerCase() };
};

export function toCsv(rows: Row[]): string {
  if (!rows.length) return "";

  const lines = [
    TRANSACTION_HEADERS.join(","),
    ...rows.map(row => {
      const { transaction, error } = row;

      if (!transaction) return "";

      return TRANSACTION_HEADERS.map(h => escapeCsvValue(transaction[h])).join(",");
    }),
  ];

  return lines.join("\n");
}

// Simple hash function - 64bit
export function fnv1a64(str: string): string {
  let hash = BigInt("0xcbf29ce484222325");
  const prime = BigInt("0x100000001b3");

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash *= prime;
    hash &= BigInt("0xffffffffffffffff");
  }

  return hash.toString(16);
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  // Escape if value contains comma, quote, or newline
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

// Wealthfolio utils

export function toPascalCase(input: string) {
  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function formatDateTime(input: string | Date | null | undefined, timezone?: string): { date: string; time: string } {
  if (!input) {
    return { date: "-", time: "-" };
  }

  // Normalize to Date object
  const dateObj = typeof input === "string"
    ? new Date(input)
    : input;

  // Validate date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return { date: "-", time: "-" };
  }

  // Determine timezone
  const effectiveTimezone =
    timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: effectiveTimezone,
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: effectiveTimezone,
  });

  return {
    date: dateFormatter.format(dateObj),
    time: timeFormatter.format(dateObj),
  };
}
