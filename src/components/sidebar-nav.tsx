import { ReactNode } from "react";

import { cn } from "@wealthfolio/ui";
import { buttonVariants } from "@wealthfolio/ui";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon?: ReactNode;
  }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SidebarNav({ className, items, activeTab, onTabChange, ...props }: SidebarNavProps) {
  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {items.map((item) => (
        <button
          type="button"
          key={item.href}
          onClick={() => onTabChange(item.href)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 justify-start rounded-md px-2 [&_svg]:size-4",
            activeTab === item.href ? "bg-muted hover:bg-muted" : "hover:bg-muted/50",
          )}
        >
          {item.icon && <span className="mr-1.5 hidden lg:inline-block">{item.icon}</span>}
          {item.title}
        </button>
      ))}
    </nav>
  );
}
