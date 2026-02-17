export interface KuveraFund {
  name: string;
  symbol: string;
}

export interface Configs {
  kuveraFunds: KuveraFund[];
}

export interface Transaction {
  date: string;
  activityType: string;
  symbol: string;
  quantity: number | null;
  unitPrice: number;
  amount: number;
  currency: string;
  fee: number;
  comment?: string;
}

export const TRANSACTION_HEADERS: (keyof Transaction)[] = [
  "date",
  "activityType",
  "symbol",
  "quantity",
  "unitPrice",
  "amount",
  "currency",
  "fee",
  "comment",
];

export interface Row {
  transaction?: Transaction;
  error: string;
}

export interface Table {
  name: string;
  rows: Row[];
  rawRows: any[];
  error: string;
}

export interface ParsedData {
  tables: Table[];
  name: string;
  format: string;
  error: string;
}

type ImportStepType = "review" | "final";

export interface ImportStep {
  id: number;
  type: ImportStepType;
  title: string;
}
