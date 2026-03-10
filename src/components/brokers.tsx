import { Badge, Button, Icons, Separator, Skeleton, cn, Input, Label, Switch, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wealthfolio/ui";
import { useState } from "react";
import { SettingsHeader } from "./settings-header";
import { BrokerSetting } from "../types";
import { useBrokerSettings } from "../hooks/use-broker-settings";

interface BrokerSettingsProps {
  broker: BrokerSetting;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateSymbolMap: (symbolMap: Record<string, string>) => void;
  isLast?: boolean;
}

function BrokerSettings({
  broker,
  onUpdateEnabled,
  onUpdateSymbolMap,
  isLast = false,
}: BrokerSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddMapping = () => {
    if (newKey && newValue) {
      onUpdateSymbolMap({ ...broker.symbolMap, [newKey]: newValue });
      setNewKey("");
      setNewValue("");
    }
  };

  const handleRemoveMapping = (key: string) => {
    const newMap = { ...broker.symbolMap };
    delete newMap[key];
    onUpdateSymbolMap(newMap);
  };

  const handleUpdateValue = (key: string, value: string) => {
    onUpdateSymbolMap({ ...broker.symbolMap, [key]: value });
  };

  return (
    <Collapsible open={isOpen && broker.mappingSupported} onOpenChange={setIsOpen}>
      <div className={cn("hover:bg-accent/30 transition-colors", !isLast && "border-b")}>
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            {broker.logoFilename ? (
              <img
                src={`/market-data/${broker.logoFilename}`}
                alt=""
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-lg">
                <Icons.Globe className="text-muted-foreground h-5 w-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{broker.name}</span>
              {broker.capabilities?.coverage && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                  {broker.capabilities.coverage}
                </Badge>
              )}
            </div>
            {broker.description && (
              <p className="text-muted-foreground mt-0.5 text-xs">{broker.description}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <Icons.Settings className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <Switch
              id={`${broker.id}-enabled`}
              checked={broker.enabled}
              onCheckedChange={onUpdateEnabled}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>

        <CollapsibleContent>
          <div className="bg-muted/30 border-t px-4 py-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Symbol Mappings
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Source Symbol / Name</Label>
                      <Input
                        placeholder={`e.g. ${broker.placeholderMap.source}`}
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Mapped Symbol</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`e.g. ${broker.placeholderMap.mapped}`}
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button size="sm" className="h-8 px-2" onClick={handleAddMapping}>
                          <Icons.Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border bg-background overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wider w-1/2">Source</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wider w-1/2">Mapped To</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {Object.entries(broker.symbolMap || {}).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground italic">
                              No mappings configured.
                            </td>
                          </tr>
                        ) : (
                          Object.entries(broker.symbolMap).map(([key, value]) => (
                            <tr key={key} className="hover:bg-muted/30 group">
                              <td className="px-3 py-2 font-mono">{key}</td>
                              <td className="px-3 py-2">
                                <Input
                                  value={value}
                                  onChange={(e) => handleUpdateValue(key, e.target.value)}
                                  className="h-7 text-xs border-transparent bg-transparent hover:border-input focus:bg-background px-1"
                                  placeholder="⚠️ Missing mapping..."
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveMapping(key)}
                                >
                                  <Icons.Trash className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function BrokerSettingsPage() {
  const { brokers, isLoading, toggleBroker, updateSymbolMap } = useBrokerSettings();

  if (isLoading) {
    return (
      <div className="text-foreground space-y-6">
        <SettingsHeader heading="Brokers" text="Configure your brokers." />
        <Separator />
        <div className="overflow-hidden rounded-lg border">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-foreground space-y-6">
      <SettingsHeader heading="Brokers" text="Configure your brokers." />
      <Separator />
      <div>
        {brokers.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No brokers available.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            {brokers.map((broker, index, arr) => (
              <BrokerSettings
                key={broker.id}
                broker={broker}
                onUpdateEnabled={(enabled) => toggleBroker(broker.id, enabled)}
                onUpdateSymbolMap={(map) => updateSymbolMap(broker.id, map)}
                isLast={index === arr.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
