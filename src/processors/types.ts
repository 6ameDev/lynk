import { ParsedData } from "../types"

export interface BrokerProcessor {
  canHandle(file: File): boolean
  process(file: File): Promise<ParsedData>
}