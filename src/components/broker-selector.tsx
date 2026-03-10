import { Icons } from "@wealthfolio/ui";
import type { FC } from "react";
import { BrokerSetting } from "../types";

type BrokerSelectorProps = {
  brokers: BrokerSetting[];
};

export const BrokerSelector: FC<BrokerSelectorProps> = ({ brokers }) => {
  if (brokers.length === 0) return null;

  return (
    <div style={{ maxWidth: 600, overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 2, padding: 4, width: "max-content" }}>
        {brokers.map((broker) => {
          // Fallback to Briefcase if specialized icon not found, 
          // though we should ideally use logos if available
          const Icon = Icons.Briefcase;

          return (
            <a
              key={broker.id}
              href={broker.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-[96px] flex-col items-center gap-1 rounded-lg border bg-background p-2 hover:bg-muted transition"
            >
              <Icon className="h-3 w-3" />
              <span className="text-[10px]">{broker.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
