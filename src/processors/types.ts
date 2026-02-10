import { ParsedData } from "../types"

export interface BrokerProcessor {
  process(file: File): Promise<ParsedData>
}