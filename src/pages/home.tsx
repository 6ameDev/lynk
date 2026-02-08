import { AddonContext } from "@wealthfolio/addon-sdk";
import { Button, Icons, Page, PageContent, PageHeader } from "@wealthfolio/ui";

interface HomePageProps {
  ctx: AddonContext;
}

export default function HomePage({ ctx }: HomePageProps) {

  const handleNavigateToConfigs = () => {
    ctx.api.navigation.navigate('/addons/lynk/configs');
  };

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNavigateToConfigs}
        className="rounded-full"
      >
        <Icons.Settings className="size-4" />
      </Button>
    </>
  );

  return (
    <Page>
      <PageHeader heading="Lynk" actions={headerActions} />

      <PageContent>
        Welcome to your new Wealthfolio addon! Start building amazing features.
      </PageContent>
    </Page>
  );

}