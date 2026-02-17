import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Icons } from "@wealthfolio/ui";
import { Row } from "../types";
import { toActivityImports } from "../steps/review-step";
import { toCsv } from "../lib";
import { ImportAlert } from "./import-alert";

interface FinalStepProps {
  ctx: AddonContext;
  account: Account;
  tables: { rows: Row[] }[];
  fileName: string;
  onBack?: () => void;
}

export function FinalStep({ ctx, account, tables, fileName, onBack }: FinalStepProps) {
  const allRows = tables.flatMap(table => table.rows);
  const activities = toActivityImports(allRows, account.id);

  const handleDownload = () => {
    if (!tables.length) return;

    const format = "csv";
    const outputCsv = toCsv(allRows);
    ctx.api.files.openSaveDialog(outputCsv, `${fileName}_processed.${format}`);
  };

  return (
    <div>
      <div className="mb-4">
        <ImportAlert
          variant="success"
          title={`Found ${activities.length} new activities`}
          description="Your generated file is ready to be downloaded."
        />
      </div>

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
