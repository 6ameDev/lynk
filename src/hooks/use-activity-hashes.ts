import { useQuery } from "@tanstack/react-query";
import { type AddonContext, QueryKeys } from "@wealthfolio/addon-sdk";
import { generateHashForActivity } from "../processors/utils";

export function useActivityHashes(ctx: AddonContext, accountId: string|undefined, activityTypes?: string[]) {
  return useQuery({
    queryKey: [QueryKeys.ACTIVITIES, accountId, activityTypes],
    queryFn: async (): Promise<Set<string>> => {
      if (!accountId) return new Set<string>();

      let page = 0;
      const pageSize = 100;
      const hashes = new Set<string>();

      while (true) {
        const { data = [], meta } = await ctx.api.activities.search(
          page,
          pageSize,
          {
            accountIds: accountId,
            activityTypes,
          },
          "",
          {}
        );

        data.forEach(activity => hashes.add(generateHashForActivity(activity)));

        if (!meta || data.length < pageSize) break;

        page++;
      }

      return hashes;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}