import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import type { Configs } from '../types';

const DEFAULT_CONFIGS: Configs = {
  kuveraFunds: []
};

const CONFIGS_KEY = 'lynk_configs';

export function useConfigs(ctx: AddonContext) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['configs'],
    queryFn: async (): Promise<Configs> => {
      try {
        const stored = localStorage.getItem(CONFIGS_KEY);
        if (stored) {
          return { ...DEFAULT_CONFIGS, ...JSON.parse(stored) };
        }
        return DEFAULT_CONFIGS;
      } catch (error) {
        ctx.api.logger.warn(
          'Failed to load configs, using defaults: ' + (error as Error).message,
        );
        return DEFAULT_CONFIGS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: async (configs: Partial<Configs>) => {
      const current = query.data || DEFAULT_CONFIGS;
      const updated = { ...current, ...configs };
      localStorage.setItem(CONFIGS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['configs'], data);
      ctx.api.logger.debug('Configs updated successfully');
    },
    onError: (error) => {
      ctx.api.logger.error('Failed to save configs: ' + error.message);
    },
  });

  return {
    configs: query.data || DEFAULT_CONFIGS,
    isLoading: query.isLoading,
    error: query.error,
    updateConfigs: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}