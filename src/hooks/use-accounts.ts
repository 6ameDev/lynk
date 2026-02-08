import { useQuery } from "@tanstack/react-query";
import { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { QueryKeys } from "@wealthfolio/addon-sdk";

export function useAccounts(ctx: AddonContext, filterActive = true) {
  const {
    data: fetchedAccounts = [],
    isLoading,
    isError,
    error,
  } = useQuery<Account[], Error>({
    queryKey: [QueryKeys.ACCOUNTS, filterActive],
    queryFn: ctx.api.accounts.getAll,
  });

  // Apply active filter if requested
  const filteredAccounts = filterActive
    ? fetchedAccounts.filter((account) => account.isActive)
    : fetchedAccounts;

  return { accounts: filteredAccounts, isLoading, isError, error };
}