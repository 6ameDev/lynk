import React, { useState } from 'react';
import { AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Card, CardContent, CardHeader, CardTitle, Icons, Input, Page, PageContent, PageHeader } from "@wealthfolio/ui";
import { useConfigs } from "../hooks/use-configs";
import { KuveraFund } from "../types";

interface ConfigsPageProps {
  ctx: AddonContext;
}

const HOME_PATH = '/addons/lynk';

export default function ConfigsPage({ ctx }: ConfigsPageProps) {
  const { configs, updateConfigs, isUpdating } = useConfigs(ctx);
  const [kuveraFunds, setKuveraFunds] = useState<KuveraFund[]>([]);

  const hasValidMappings = sanitiseFunds(kuveraFunds).length > 0;

  // Initialize Kuvera funds from configs
  React.useEffect(() => {
    if (configs.kuveraFunds.length > 0) {
      setKuveraFunds(configs.kuveraFunds);
    }
  }, [configs.kuveraFunds]);

  const handleSaveConfigs = () => {
    const sanitisedFunds = sanitiseFunds(kuveraFunds);

    updateConfigs({
      kuveraFunds: Array.from(sanitisedFunds),
    });
    ctx.api.navigation.navigate(HOME_PATH);
  };

  function sanitiseFunds(funds: KuveraFund[]): KuveraFund[] {
    const seen = new Set<string>();
    const result: KuveraFund[] = [];

    for (const fund of funds) {
      const name = fund.name.trim();
      const symbol = fund.symbol.trim();

      // Drop empty rows
      if (!name || !symbol) continue;

      const key = name.toLowerCase();

      // De-duplicate by fund name
      if (seen.has(key)) continue;

      seen.add(key);
      result.push({ name, symbol });
    }

    return result;
  }

  // if (isLoading) {
  //   return <ActivitySelectorSkeleton />;
  // }

  const pageDescription = "Configure essential mappings and preferences.";

  const headerActions = (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button variant="outline" onClick={() => ctx.api.navigation.navigate(HOME_PATH)}>
        <Icons.ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      <Button onClick={handleSaveConfigs} disabled={isUpdating || !hasValidMappings}>
        {isUpdating ? (
          <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.Save className="mr-2 h-4 w-4" />
        )}
        Save
      </Button>
    </div>
  );

  return (
    <Page>
      <PageHeader heading="Lynk Configs" text={pageDescription} actions={headerActions}/>
      <PageContent className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Kuvera Funds Mapping</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {kuveraFunds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No fund mappings configured yet.
              </p>
            )}

            {kuveraFunds.map((fund, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Fund name"
                  value={fund.name}
                  onChange={(e) => {
                    const next = [...kuveraFunds];
                    next[index] = {
                      ...next[index],
                      name: e.target.value,
                    };
                    setKuveraFunds(next);
                  }}
                />

                <Input
                  placeholder="Symbol (YahooFinance)"
                  value={fund.symbol}
                  onChange={(e) => {
                    const next = [...kuveraFunds];
                    next[index] = {
                      ...next[index],
                      symbol: e.target.value,
                    };
                    setKuveraFunds(next);
                  }}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setKuveraFunds(kuveraFunds.filter((_, i) => i !== index));
                  }}
                >
                  <Icons.Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                setKuveraFunds([
                  ...kuveraFunds,
                  { name: "", symbol: "" },
                ])
              }
            >
              <Icons.Plus className="h-4 w-4 mr-2" />
              Add mapping
            </Button>
          </CardContent>
        </Card>

        {isUpdating && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm mt-2">
            <Icons.Spinner className="h-4 w-4 animate-spin" />
            Saving mappings…
          </div>
        )}
      </PageContent>
    </Page>
  );
}
