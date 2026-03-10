import { useEffect, useState } from "react";
import { BrokerSetting } from "../types";

const STORAGE_KEY = "lynk-broker-settings";

const BROKERS_SEED: BrokerSetting[] = [
  {
    id: "zerodha",
    name: "Zerodha",
    description: "India's largest stock broker and trading platform.",
    url: "https://zerodha.com",
    logoFilename: null,
    enabled: false,
    mappingSupported: true,
    symbolMap: {},
    placeholderMap: {
      source: "FOOBAR",
      mapped: "FOOBAR.NS"
    },
    capabilities: {
      instruments: "Stocks, Mutual Funds, F&O",
      coverage: "India",
    },
    errorCount: 0,
  },
  {
    id: "kuvera",
    name: "Kuvera",
    description: "Free Direct Mutual Fund Investment Platform.",
    url: "https://kuvera.in/reports/transactions",
    logoFilename: null,
    enabled: false,
    mappingSupported: true,
    symbolMap: {},
    placeholderMap: {
      source: "ABC Nifty 50 Index Fund Direct Growth",
      mapped: "0P0000AABC.BO"
    },
    capabilities: {
      instruments: "Mutual Funds, Stocks, Gold",
      coverage: "India",
    },
    errorCount: 0,
  },
  {
    id: "vested",
    name: "Vested",
    description: "Helping Indians invest globally with confidence.",
    url: "https://app.vestedfinance.com/en/global/transaction-history",
    logoFilename: null,
    enabled: false,
    mappingSupported: false,
    symbolMap: {},
    placeholderMap: {},
    capabilities: {
      instruments: "Stocks, ETFs",
      coverage: "US",
    },
    errorCount: 0,
  },
];

function loadFromStorage(): Record<string, Partial<BrokerSetting>> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load broker settings from storage", e);
    return {};
  }
}

function saveToStorage(data: Record<string, Partial<BrokerSetting>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save broker settings to storage", e);
  }
}

export function useBrokerSettings() {
  const [brokers, setBrokers] = useState<BrokerSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storageData = loadFromStorage();

    const initializedBrokers: BrokerSetting[] = BROKERS_SEED.map((seed) => {
      const stored = storageData[seed.id] || {};

      return {
        ...seed,
        enabled: stored.enabled ?? seed.enabled,
        symbolMap: stored.symbolMap ?? seed.symbolMap,
        errorCount: stored.errorCount ?? seed.errorCount,
      };
    });

    setBrokers(initializedBrokers);
    setIsLoading(false);
  }, []);

  const updateBroker = (brokerId: string, updates: Partial<BrokerSetting>) => {
    setBrokers((prev) => {
      const next = prev.map((b) => {
        if (b.id !== brokerId) return b;

        const nextBroker = { ...b, ...updates };
        if (updates.symbolMap) {
          nextBroker.errorCount = Object.values(nextBroker.symbolMap).filter((v) => !v).length;
        }
        return nextBroker;
      });

      // Persist only user-modifiable fields
      const storageData = loadFromStorage();
      const broker = next.find((b) => b.id === brokerId);
      if (broker) {
        storageData[brokerId] = {
          enabled: broker.enabled,
          symbolMap: broker.symbolMap,
          errorCount: broker.errorCount,
        };
        saveToStorage(storageData);
      }

      return next;
    });
  };

  const toggleBroker = (brokerId: string, enabled: boolean) => {
    updateBroker(brokerId, { enabled });
  };

  const updateSymbolMap = (brokerId: string, symbolMap: Record<string, string>) => {
    updateBroker(brokerId, { symbolMap });
  };

  const enabledBrokers = brokers.filter((b) => b.enabled);

  return {
    brokers,
    enabledBrokers,
    isLoading,
    toggleBroker,
    updateSymbolMap,
    updateBroker,
  };
}
