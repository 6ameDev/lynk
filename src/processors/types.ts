import { Configs, ParsedData } from "../types"

export interface BrokerProcessor {
  process(configs: Configs, file: File): Promise<ParsedData>
}