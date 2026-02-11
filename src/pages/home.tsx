import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Card, CardContent, CardHeader, Icons, Page, PageContent, PageHeader } from "@wealthfolio/ui";

import { ParsedData } from "../types";
import { findProcessor } from "../processors";
import { ReviewStep } from "../steps/review-step";
import { getFileMeta, toCsv } from "../lib";
import { Broker, BrokerSelector } from "../components";
import { StepIndicator, FileDropzone, AccountSelector, HelpTooltip, ImportAlert } from "../components";
import { useConfigs } from "../hooks/use-configs";

interface HomePageProps {
  ctx: AddonContext;
}

const SUPPORTED_BROKERAGES: Broker[] = [
  {
    id: "kuvera",
    name: "Kuvera",
    icon: "Briefcase",
    url: "https://kuvera.in/reports/transactions",
  },
  {
    id: "vested",
    name: "Vested",
    icon: "Briefcase",
    url: "https://app.vestedfinance.com/en/global/transaction-history",
  },
];

export default function HomePage({ ctx }: HomePageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingError, setParsingError] = useState<string>("");
  const [parsedFile, setParsedFile] = useState<ParsedData | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { configs } = useConfigs(ctx);

  const { tables, format: fileType, error: parsingErrors } = parsedFile ? parsedFile : {};
  const canReview = selectedAccount && file && tables && tables?.length > 0;

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

  function resetStates() {
    setFile(null);
    setParsingError("");
    setParsedFile(null);
    setIsParsing(false);
    setCurrentStep(1);
  }

  const handleAccountChange = (account: Account) => {
    if (account.id === selectedAccount?.id) return;

    resetStates();
    setSelectedAccount(account);
  }

  const handleFileChange = (file: File | null) => {
    if (selectedAccount && file) {
      setFile(file);
      const processor = findProcessor(selectedAccount, file);
      
      if (processor) {
        setIsParsing(true);
        processor
          .process(configs, file)
          .then((result) => {
            setParsedFile(result);
            ctx.api.logger.debug(`File has been processed: ${result}`);
          })
          .catch((err) => {
            setParsingError(err.message);
            ctx.api.logger.error(`Failed to parse file(${file.name}): ${err}`);
          })
          .finally(() => setIsParsing(false));
      } else {
        setParsingError(`Support for ${selectedAccount.name} broker hasn't been added yet.`);
        ctx.api.logger.error(`Failed to find a processor for file(${file.name})`);
      }
    } else {
      resetStates();
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
        rows={table.rows}
        onBack={currentStep > 1 ? goToPreviousStep : undefined}
        onNext={currentStep < steps.length ? goToNextStep : undefined}
      />
    );
  };

  const handleDownload = () => {
    if (!file || !tables?.length) return;

    const outputFormat = "csv";

    // Combine rows from all tables
    const allRows = tables.flatMap(table => table.rows);
    const outputCsv = toCsv(allRows);
    const { name } = getFileMeta(file);

    ctx.api.files.openSaveDialog(outputCsv, `${name}_processed.${outputFormat}`);
  };

  const headerActions = (
    <>
      <BrokerSelector brokers={SUPPORTED_BROKERAGES} />
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

      <PageContent className="">
        {/* SECTION A: Account + File */}
        <div className="px-6 pt-2 pb-2 sm:px-4 md:px-6">
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
                  setSelectedAccount={handleAccountChange}
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
                  key={selectedAccount?.id ?? "no-account"}
                  file={file}
                  onFileChange={handleFileChange}
                  isLoading={isParsing}
                  accept="*"
                  disabled={selectedAccount == null}
                  isValid={fileValidationStatus === "valid"}
                  error={parsingErrors ? "File contains errors" : null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Steps for review */}
        {parsingError.length > 0 && (
          <div className="px-6 pt-2 pb-2 sm:px-4 md:px-6">
            <ImportAlert
              variant="destructive"
              title="Failed Processing!"
              description={(<div style={{ whiteSpace: "pre-line" }}>{parsingError}</div>)}
              icon={Icons.XCircle}
            />
          </div>
        )}
        {canReview && (
          <div className="px-6 pt-2 pb-2 sm:px-4 md:px-6">
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

        {/* SECTION C: Actions: Download */}
        {currentStep == steps.length && (
          <div className="px-6 pt-2 pb-2 sm:px-4 md:px-6">
            <Card className="w-full">
              <CardHeader className="border-b px-3 py-3 sm:px-6 sm:py-4">
                <div>
                  <ImportAlert
                    variant="success"
                    title="Completed processing!"
                    description="All transactions have been processed & are ready to download"
                    icon={Icons.FileX}
                  />
                </div>
                <div className="hidden w-full items-center justify-center md:flex">
                  <Button onClick={handleDownload}>
                    <Icons.Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </PageContent>
    </Page>
  );
}
