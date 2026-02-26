import { useQuery } from "@tanstack/react-query";
import { type AddonContext, QueryKeys } from "@wealthfolio/addon-sdk";

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
          ""
        );

        data.forEach(activity => {
          const hash = activity.comment ?? "";
          hashes.add(hash);
        });

        if (!meta || data.length < pageSize) break;

        page++;
      }

      return hashes;
    },
    enabled: !!accountId,
    staleTime: 1 * 10 * 1000, // 5 minutes
    gcTime: 1 * 10 * 1000, // 10 minutes
  });
}