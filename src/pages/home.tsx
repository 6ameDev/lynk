import { Account, ActivityType, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Card, CardContent, CardHeader, CardTitle, Icons, Page, PageContent, PageHeader, ProgressIndicator } from "@wealthfolio/ui";
import { useEffect, useState } from "react";
import { HelpTooltip } from "../components/help-tooltip";
import { AccountSelector } from "../components/account-selector";
import { FileDropzone } from "../components/file-dropzone";
import { useFileParser } from "../hooks/use-file-parser";
import { StepIndicator } from "../components/step-indicator";
import { AnimatePresence, motion } from "motion/react";
import { ReviewStep } from "../steps/review-step";

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
    icon: "Briefcase",
    loginUrl: "https://kuvera.in",
  },
  {
    id: "vested",
    name: "Vested",
    icon: "Briefcase",
    loginUrl: "https://vestedfinance.com",
  },
];

// Define the steps in the wizard
// const STEPS = [
//   { id: 1, title: "Review" },
//   { id: 2, title: "Confirm" },
//   { id: 3, title: "Download" },
// ];


export default function HomePage({ ctx }: HomePageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(null);
  const [outputCsv, setOutputCsv] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    fileType,
    tables,
    isParsing,
    errors: parsingErrors,
    selectedFile,
    parseFile,
    resetFileParser
  } = useFileParser();

  const steps = tables?.map((table, index) => ({
    id: index + 1,
    title: table.name || 'Content',
  })) ?? [];

  useEffect(() => {
    if (tables && tables.length > 0) {
      setCurrentStep(1);
    }
  }, [tables]);

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

  // Step Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  // Render the current step
  const renderStep = () => {
    if (!tables || !selectedAccount || !fileType) return null;

    const tableIndex = currentStep - 1;
    const table = tables[tableIndex];

    if (!table) return null;

    return (
      <ReviewStep
        key={table.name}
        account={selectedAccount}
        activityTypes={["ADD_HOLDING", "REMOVE_HOLDING"]}
        fileType={fileType}
        tableName={table.name}
        headers={table.headers}
        rows={table.rows}
        onBack={goToPreviousStep}
        onNext={goToNextStep}
      />
    );
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
          <h3 className="text-sm font-medium text-muted-foreground">Supported Brokers</h3>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {SUPPORTED_BROKERAGES.map((b) => {
              const Icon = Icons[b.icon];
              return (
                <a
                  key={b.id}
                  href={b.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-[96px] flex-col items-center gap-2 rounded-lg border bg-background p-3 hover:bg-muted transition"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{b.name}</span>
                </a>
              );
            })}
          </div>
        </section>

        {/* SECTION B: Account + File */}
        <div className="px-6 pt-2 pb-6 sm:px-4 sm:pt-4 md:px-6 md:pt-6">
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
        </div>

        {/* SECTION C: Steps for review */}
        {selectedAccount && selectedFile && tables && tables?.length > 0 && (
          <div className="px-6 pt-2 pb-6 sm:px-4 sm:pt-4 md:px-6 md:pt-6">
            <Card className="w-full">
              <CardHeader className="border-b px-3 py-3 sm:px-6 sm:py-4">
                <StepIndicator steps={steps} currentStep={currentStep} />
              </CardHeader>
              <CardContent className="overflow-hidden p-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 sm:p-6"
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}

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
