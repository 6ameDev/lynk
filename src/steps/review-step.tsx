import { Account, ActivityImport, ActivityType, Settings } from "@wealthfolio/addon-sdk";
import { Button, Icons, ProgressIndicator } from "@wealthfolio/ui";
import { Row } from "../types";
import ActivitiesPreview from "../components/activities-preview";
import { ImportAlert } from "../components";

interface ReviewStepProps {
  settings: Settings;
  account: Account;
  rows: Row[];
  onNext?: () => void;
  onBack?: () => void;
}

export function toActivityImports(rows: Row[], accountId: string): ActivityImport[] {
  return rows
    .map((row, index): ActivityImport | null => {
      if (!row.transaction) return null;

      const { transaction, error } = row;

      return {
        accountId,
        activityType: transaction.activityType as ActivityType,
        date: transaction.date,
        symbol: transaction.symbol,
        quantity: transaction.quantity ?? undefined,
        unitPrice: transaction.unitPrice,
        amount: transaction.amount,
        currency: transaction.currency,
        fee: transaction.fee,
        comment: transaction.comment ?? undefined,

        // Metadata
        isValid: error.length === 0,
        errors: error.length
          ? { general: [error] }
          : undefined,
        lineNumber: index,
        isDraft: true,
      };
    })
    .filter((v): v is ActivityImport => v !== null);
}

export const ReviewStep = ({
  settings,
  account,
  rows,
  onBack,
  onNext,
}: ReviewStepProps) => {
  const accounts = [account];
  const activities = toActivityImports(rows, account.id);

  return (
    <div>
      {/* Row 1: Alert Notification */}
      <div className="mb-4">
        <ImportAlert
          variant="success"
          title={`All ${activities.length} activities are valid`}
          description="Your data is ready to be imported."
        />
      </div>

      {/* Row 2: Activities Preview */}
      <div className="mb-4">
        <ActivitiesPreview settings={settings} activities={activities} accounts={accounts} />
      </div>

      {/* Row 3: Action buttons */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={onBack == undefined}>
          Back
        </Button>
        <Button onClick={onNext} disabled={onNext == undefined}>
          {false ? "Validating..." : "Next"}
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Loading indicator */}
      <ProgressIndicator
        title="Reading the file"
        description="Please wait while the application processes your data."
        message="Reading the file..."
        isLoading={false}
        open={false}
      />
    </div>
  );
}