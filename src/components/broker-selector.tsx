import { Icons } from "@wealthfolio/ui";
import type { FC } from "react";

export type Broker = {
  id: string;
  name: string;
  icon: keyof typeof Icons;
  url: string;
};

type BrokerSelectorProps = {
  brokers: Broker[];
  maxWidth?: number | string;
};

export const BrokerSelector: FC<BrokerSelectorProps> = ({
  brokers,
  maxWidth = 600,
}) => {
  return (
    <div style={{maxWidth, overflowX: "auto"}}>
      <div style={{display: "flex", gap: 2, padding: 4, width: "max-content"}}>
        {brokers.map((broker) => {
          const Icon = Icons[broker.icon];

          return (
            <a
              key={broker.id}
              href={broker.url}
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
