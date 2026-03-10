import { Account } from "@wealthfolio/addon-sdk";
import { KuveraProcessor } from "./kuvera";
import { VestedProcessor } from "./vested";
import { ZerodhaProcessor } from "./zerodha";
import { BrokerProcessor, BrokerSetting } from "../types";

type BrokerKey = "kuvera" | "vested" | "zerodha";

export function findProcessor(
  account: Account,
  brokerSettings: BrokerSetting[]
): BrokerProcessor | undefined {
  const key = account.name.toLowerCase() as BrokerKey;
  const setting = brokerSettings.find((broker) => broker.id === key);

  if (!setting || !setting.enabled) return undefined;

  switch (key) {
    case "kuvera":
      return new KuveraProcessor(setting);
    case "vested":
      return new VestedProcessor(setting);
    case "zerodha":
      return new ZerodhaProcessor(setting);
    default:
      return undefined;
  }
}
