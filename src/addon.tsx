import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { AddonContext } from '@wealthfolio/addon-sdk';

import HomePage from './pages/home';
import ConfigsPage from './pages/configs';

import LynkIcon from './components/lynk-icon';

function LynkAddon({ ctx }: { ctx: AddonContext }) {
  return (
    <div className="lynk-addon">
      <QueryClientProvider client={ctx.api.query.getClient() as QueryClient}>
        <HomePage ctx={ctx} />
      </QueryClientProvider>
    </div>
  );
}

// Addon enable function - called when the addon is loaded
export default function enable(ctx: AddonContext) {
  ctx.api.logger.info('Lynk addon is being enabled');

  // Store references to items for cleanup
  const addedItems: { remove: () => void }[] = [];

  // Add a sidebar item
  const sidebarItem = ctx.sidebar.addItem({
    id: 'lynk',
    label: 'Lynk',
    icon: <LynkIcon />,
    route: '/addons/lynk',
    order: 100,
  });

  // Create wrapper component with QueryClientProvider using shared client
  const LynkWrapper = () => {
    const sharedQueryClient = ctx.api.query.getClient() as QueryClient;
    return (
      <QueryClientProvider client={sharedQueryClient}>
        <LynkAddon ctx={ctx} />
      </QueryClientProvider>
    );
  };

  // Register main dashboard route

  // Register route
  ctx.router.add({
    path: '/addons/lynk',
    component: React.lazy(() =>
      Promise.resolve({
        default: LynkWrapper,
      }),
    ),
  });

  // Register configs route
  ctx.router.add({
    path: '/addons/lynk/configs',
    component: React.lazy(() =>
      Promise.resolve({
        default: () => {
          const sharedQueryClient = ctx.api.query.getClient() as QueryClient;
          return (
            <QueryClientProvider client={sharedQueryClient}>
              <ConfigsPage ctx={ctx} />
            </QueryClientProvider>
          );
        },
      }),
    ),
  });

  // Cleanup on disable
  ctx.onDisable(() => {
    ctx.api.logger.info('Lynk addon is being disabled');

    try {
      sidebarItem.remove();
    } catch (err) {
      ctx.api.logger.error('Error removing sidebar item: ' + (err as Error).message);
    }

    ctx.api.logger.info('Lynk addon disabled');
  });
}
