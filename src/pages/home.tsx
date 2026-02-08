import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Card, CardContent, CardHeader, CardTitle, Icons, Page, PageContent, PageHeader } from "@wealthfolio/ui";
import { useState } from "react";
import { HelpTooltip } from "../components/help-tooltip";
import { AccountSelector } from "../components/account-selector";
import { FileDropzone } from "../components/file-dropzone";
import { useFileParser } from "../hooks/use-file-parser";

interface HomePageProps {
  ctx: AddonContext;
}

// --- Types ---
type Brokerage = {
  id: string;
  name: string;
  icon: keyof typeof Icons;
  loginUrl: string;
};

// --- Mock data (replace with real list later) ---
const SUPPORTED_BROKERAGES: Brokerage[] = [
  {
    id: "kuvera",
    name: "Kuvera",
    icon: "ArrowRightLeft",
    loginUrl: "https://kuvera.in",
  },
  {
    id: "vested",
    name: "Vested",
    icon: "Database",
    loginUrl: "https://vestedfinance.com",
  },
];


export default function HomePage({ ctx }: HomePageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(null);
  const [outputCsv, setOutputCsv] = useState<string | null>(null);

  const {
    tables,
    isParsing,
    errors: parsingErrors,
    selectedFile,
    parseFile,
    resetFileParser
  } = useFileParser();

  const fileValidationStatus = parsingErrors
      ? "invalid"
      : isParsing
        ? "loading"
        : "valid";

  const handleFileChange = (file: File | null) => {
    if (file) {
      parseFile(file);
    } else {
      resetFileParser();
    }
  };

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => ctx.api.navigation.navigate('/addons/lynk/configs')}
        className="rounded-full"
      >
        <Icons.Settings className="size-4" />
      </Button>
    </>
  );

  return (
    <Page>
      <PageHeader heading="Lynk" text="" actions={headerActions}/>

      <PageContent className="space-y-6">
        {/* SECTION A: Import / Brokerages */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Import</h3>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {SUPPORTED_BROKERAGES.map((b) => {
              const Icon = Icons[b.icon];
              return (
                <button
                  key={b.id}
                  onClick={() => ctx.api.navigation.navigate(b.loginUrl)}
                  className="flex min-w-[96px] flex-col items-center gap-2 rounded-lg border bg-background p-3 hover:bg-muted transition"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{b.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION B: Account + File */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center">
              <h2 className="font-semibold">Select Account</h2>
              <HelpTooltip content="Make sure to select the account you want to import activities for" />
            </div>
            <div className="h-[120px]">
              <AccountSelector
                ctx={ctx}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center">
              <h2 className="font-semibold">Upload File</h2>
              <HelpTooltip content="Upload a file containing your investment activities. The file should include headers in the first row. Supported file types: CSV, XLSX" />
            </div>
            <div className="h-[120px]">
              <FileDropzone
                file={selectedFile}
                onFileChange={handleFileChange}
                isLoading={isParsing}
                accept="*"
                isValid={fileValidationStatus === "valid"}
                error={parsingErrors ? "File contains errors" : null}
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Output preview + download */}
        {outputCsv && (
          <section className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Generated CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[300px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {outputCsv}
                </pre>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() =>
                  ctx.api.files.openSaveDialog(
                    outputCsv,
                    "lynk_processed.csv",
                  )
                }
              >
                <Icons.Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </section>
        )}
      </PageContent>
    </Page>
  );
}
