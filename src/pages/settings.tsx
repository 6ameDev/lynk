import { useState } from "react";
import { AddonContext } from "@wealthfolio/addon-sdk";
import { ApplicationShell, Icons, Button, Page, PageContent, PageHeader } from "@wealthfolio/ui";

import { SidebarNav } from "../components/sidebar-nav";
import BrokerSettingsPage from "../components/brokers";

interface SettingsPageProps {
  ctx: AddonContext;
}

const HOME_PATH = '/addons/lynk';

const settingsSections = [
  {
    title: "External",
    items: [
      {
        title: "Brokers",
        href: "brokers",
        subtitle: "Brokerage accounts",
        icon: <Icons.CloudSync2 className="size-6" />,
      }
    ],
  },
  {
    title: "About",
    items: [
      {
        title: "About",
        href: "about",
        subtitle: "Application information",
        icon: <Icons.InfoCircle className="size-5" />,
      },
    ],
  },
];

export default function SettingsPage({ ctx }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("brokers");

  const renderContent = () => {
    switch (activeTab) {
      case "brokers":
        return <BrokerSettingsPage />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icons.Settings className="text-muted-foreground/20 mb-4 size-12" />
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm">
              We are working hard to bring the {activeTab} settings to you. Stay tuned!
            </p>
          </div>
        );
    }
  };

  const headerActions = (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button variant="outline" onClick={() => ctx.api.navigation.navigate(HOME_PATH)}>
        <Icons.ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );

  return (
    <ApplicationShell className="settings-root app-shell h-screen overflow-x-hidden">
      <Page>
        <PageHeader heading="Settings | Lynk" text="" actions={headerActions} />
        <PageContent>
          <div className="flex gap-10">
            <aside className="hidden w-[240px] shrink-0 lg:sticky lg:top-24 lg:flex lg:flex-col lg:self-start">
              <div className="space-y-6">
                {settingsSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-muted-foreground pl-2 text-sm font-light uppercase tracking-widest">
                      {section.title}
                    </div>
                    <SidebarNav
                      items={section.items}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </div>
                ))}
              </div>
            </aside>
            <div className="flex w-full max-w-4xl flex-col px-2 py-8">
              <div className="mb-8 min-w-0 flex-10">
                {renderContent()}
              </div>
            </div>
          </div>
        </PageContent>
      </Page>
    </ApplicationShell>
  );
}
