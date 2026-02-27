import { Account } from "@wealthfolio/addon-sdk";
import { kuveraProcessor } from "./kuvera";
import { vestedProcessor } from "./vested";
import { BrokerProcessor } from "../types";

type BrokerKey = "kuvera" | "vested";

const BROKER_PROCESSORS: Partial<Record<BrokerKey, BrokerProcessor>> = {
  kuvera: kuveraProcessor,
  vested: vestedProcessor,
};

export function findProcessor(account: Account, file: File): BrokerProcessor | undefined {
  const key = account.name.toLowerCase() as BrokerKey;
  return BROKER_PROCESSORS[key];
}
