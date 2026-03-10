import { cn } from "@wealthfolio/ui";

interface SettingsHeaderProps {
  heading: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SettingsHeader({
  heading,
  text,
  className,
  children,
}: SettingsHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-start gap-2",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="grid min-w-0 gap-1">
          <h1 className="font-heading break-words text-lg font-bold lg:text-xl">{heading}</h1>
          {text && (
            <p className="text-muted-foreground lg:text-md break-words text-sm font-light">
              {text}
            </p>
          )}
        </div>
      </div>
      {children && <div className="justify-self-end">{children}</div>}
    </div>
  );
}
