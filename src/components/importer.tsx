import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { ImportAlert } from "./import-alert";
import { Card, CardContent, CardHeader, Icons } from "@wealthfolio/ui";
import { StepIndicator } from "./step-indicator";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ImportStep, ParsedData } from "../types";
import { ReviewStep } from "../steps/review-step";
import { findProcessor } from "../processors";
import { useActivityHashes } from "../hooks/use-activity-hashes";
import { useConfigs } from "../hooks/use-configs";
import { useSettings } from "../hooks/use-settings";
import { FinalStep } from "../steps/final-step";

interface ImporterProps {
  ctx: AddonContext;
  account: Account | null | undefined;
  file: File | null;
  setIsParsing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Importer({ ctx, account, file, setIsParsing }: ImporterProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [parsingError, setParsingError] = useState<string>("");
  const [parsedFile, setParsedFile] = useState<ParsedData | null>(null);

  const { configs } = useConfigs(ctx);
  const { data: settings } = useSettings(ctx);
  const { data: fetchedHashes, isFetching } = useActivityHashes(ctx, account?.id);

  const { tables, name, error: parsingErrors } = parsedFile ? parsedFile : {};
  const canReview = account && file && tables && tables?.length > 0;

  const reviewSteps: ImportStep[] = tables?.map((table, index) => ({
    id: index + 1,
    type: "review",
    title: table.name || "Content",
  })) ?? [];

  const finalStep: ImportStep = {
    id: reviewSteps.length + 1,
    type: "final",
    title: "Final",
  };

  const steps = tables ? [...reviewSteps, finalStep] : [];

  useEffect(() => {
    if (!file || !account || !fetchedHashes || isFetching) {
      resetStates();
      return;
    }

    // Process file and set derived states
    const processor = findProcessor(account, file);
    if (processor) {
      setIsParsing(true);

      processor.process(configs, file)
      .then((result) => {
        const newActivities = filterNewActivities(result, fetchedHashes);
        setParsedFile(newActivities);
        ctx.api.logger.debug(`File has been processed`);
      })
      .catch((err) => {
        setParsingError(err.message);
        ctx.api.logger.error(`Failed to parse file(${file.name}): ${err}`);
      })
      .finally(() => {
        setIsParsing(false);
      });
    } else {
      setParsingError(`Support for ${account.name} broker hasn't been added yet.`);
      ctx.api.logger.error(`Failed to find a processor for file(${file.name})`);
    }
  }, [file, account, configs, fetchedHashes]);

  useEffect(() => {
    if (tables && tables.length > 0) {
      setCurrentStep(1);
    }
  }, [tables]);

  function resetStates() {
    setCurrentStep(0);
    setParsedFile(null);
    setParsingError("");
  }

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
    if (!settings || !account || !tables || !name) return null;

    const step = steps[currentStep - 1];
    if (!step) return null;

    if (step.type === "review") {
      const tableIndex = currentStep - 1;
      const table = tables[tableIndex];
      if (!table) return null;

      return (
        <ReviewStep
          key={table.name}
          settings={settings}
          account={account}
          rows={table.rows}
          onBack={currentStep > 1 ? goToPreviousStep : undefined}
          onNext={goToNextStep}
        />
      );
    }

    if (step.type === "final") {
      return (
        <FinalStep
          ctx={ctx}
          settings={settings}
          account={account}
          tables={tables}
          fileName={name}
          onBack={goToPreviousStep}
        />
      );
    }

    return null;
  };

  function filterNewActivities(data: ParsedData, hashes: Set<string>): ParsedData {
    const filteredTables = data.tables.map((table) => {
      const newRows = table.rows.filter((row) => {
        if (!row.transaction) return false;

        const hash = row.transaction.comment ?? "";
        return !hashes.has(hash);
      });

      return {
        ...table,
        rows: newRows,
      };
    });

    return {
      ...data,
      tables: filteredTables,
    };
  }

  return (
    <div>
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
    </div>
  );
}