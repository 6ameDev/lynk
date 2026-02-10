import { Account, ActivityType } from "@wealthfolio/addon-sdk";
import { Button, Icons, ProgressIndicator } from "@wealthfolio/ui";
import { TableViewer } from "../components/table-viewer";
import { Row } from "../types";
import { toTableViewerRows } from "../lib";

interface ReviewStepProps {
  fileType: string;
  tableName?: string;
  rows: Row[];
  account: Account;
  activityTypes: ActivityType[];
  onNext?: () => void;
  onBack?: () => void;
}

export const ReviewStep = ({
  fileType,
  tableName,
  rows,
  account,
  activityTypes,
  onBack,
  onNext,
}: ReviewStepProps) => {
  const tableData = toTableViewerRows(rows);

  return (
    <div>
      <div className="mb-4">
        <TableViewer name={tableName} data={tableData} fileType={fileType} className="w-full" maxHeight="30vh" />
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