export interface BrokerProcessor {
  process(file: File): Promise<ParsedData>
}

export interface KuveraFund {
  name: string;
  symbol: string;
}

export interface BrokerSetting {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  logoFilename: string | null;
  enabled: boolean;
  mappingSupported: boolean;
  symbolMap: Record<string, string>;
  placeholderMap: Record<string, string>;
  capabilities: {
    instruments: string | null;
    coverage: string | null;
  };
  errorCount: number;
}

export interface Configs {
  // Global configs here
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
  brokerId: string;
  updatedBrokerSettings?: Partial<BrokerSetting>;
}

type ImportStepType = "review" | "final";

export interface ImportStep {
  id: number;
  type: ImportStepType;
  title: string;
}
