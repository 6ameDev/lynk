import { Account, AddonContext, Settings } from "@wealthfolio/addon-sdk";
import { Button, Icons } from "@wealthfolio/ui";
import { Row } from "../types";
import { toActivityImports } from "./review-step";
import { toCsv } from "../lib";
import { ImportAlert } from "../components/import-alert";
import ActivitiesPreview from "../components/activities-preview";

interface FinalStepProps {
  ctx: AddonContext;
  settings: Settings;
  account: Account;
  tables: { rows: Row[] }[];
  fileName: string;
  onBack?: () => void;
}

export function FinalStep({ ctx, settings, account, tables, fileName, onBack }: FinalStepProps) {
  const allRows = tables.flatMap(table => table.rows);
  const activities = toActivityImports(allRows, account.id);
  const accounts = [account];

  const handleDownload = () => {
    if (!tables.length) return;

    const format = "csv";
    const outputCsv = toCsv(allRows);
    ctx.api.files.openSaveDialog(outputCsv, `${fileName}_processed.${format}`);
  };

  return (
    <div>
      {/* Row 1: Alert Notification */}
      <div className="mb-4">
        <ImportAlert
          variant="success"
          title={`Found ${activities.length} new activities`}
          description="Your generated file is ready to be downloaded."
        />
      </div>

      {/* Row 2: Activities Preview */}
      <div className="mb-4">
        <ActivitiesPreview settings={settings} activities={activities} accounts={accounts} />
      </div>

      {/* Row 3: Action buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button onClick={handleDownload}>
          <Icons.Download className="ml-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
