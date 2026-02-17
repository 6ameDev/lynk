import { useState } from "react";

import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Icons, Page, PageContent, PageHeader } from "@wealthfolio/ui";

import { Broker, BrokerSelector } from "../components";
import { FileDropzone, AccountSelector, HelpTooltip } from "../components";
import Importer from "../components/importer";

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
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  // const [parsedFile, setParsedFile] = useState<ParsedData | null>(null);
  // const { tables, format: fileType, error: parsingErrors } = parsedFile ? parsedFile : {};

  // const fileValidationStatus = parsingErrors
  //     ? "invalid"
  //     : isParsing
  //       ? "loading"
  //       : "valid";

  const parsingErrors: string | undefined = undefined;
  const fileValidationStatus = "valid";

  function resetStates() {
    setFile(null);
    setIsParsing(false);
  }

  const handleAccountChange = (account: Account) => {
    if (account.id === selectedAccount?.id) return;

    resetStates();
    setSelectedAccount(account);
  }

  const handleFileChange = (file: File | null) => {
    if (file) {
      setFile(file);
    } else {
      resetStates();
    }
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
        <Importer ctx={ctx} account={selectedAccount} file={file} setIsParsing={setIsParsing} />

      </PageContent>
    </Page>
  );
}
