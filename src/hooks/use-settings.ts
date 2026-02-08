import { useQuery } from "@tanstack/react-query";
import { AddonContext, Settings } from "@wealthfolio/addon-sdk";
import { QueryKeys } from "@wealthfolio/addon-sdk";

export function useSettings(ctx: AddonContext) {
  return useQuery<Settings, Error>({
    queryKey: [QueryKeys.SETTINGS],
    queryFn: ctx.api.settings.get,
  });
}