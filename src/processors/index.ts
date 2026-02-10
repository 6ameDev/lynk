import { Account } from "@wealthfolio/addon-sdk";
import { kuveraProcessor } from "./kuvera";
import type { BrokerProcessor } from "./types";
// import { vestedProcessor } from "./vested/vested.processor"


type BrokerKey = "kuvera" | "vested";

const BROKER_PROCESSORS: Partial<Record<BrokerKey, BrokerProcessor>> = {
  kuvera: kuveraProcessor,
};

export function findProcessor(account: Account, file: File): BrokerProcessor | undefined {
  const key = account.name.toLowerCase() as BrokerKey;
  return BROKER_PROCESSORS[key];
}
