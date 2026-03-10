import { useEffect, useState } from "react";
import { BrokerSetting } from "../types";

const STORAGE_KEY = "lynk-broker-settings";

const BROKERS_SEED: Omit<BrokerSetting, "assetCount" | "errorCount" | "lastSyncedAt" | "lastSyncError" | "uniqueErrors">[] = [
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
      source: "ZOMATO",
      mapped: "ZOMATO.NS"
    },
    capabilities: {
      instruments: "Stocks, Mutual Funds, F&O",
      coverage: "India",
    },
  },
  {
    id: "kuvera",
    name: "Kuvera",
    description: "Free Direct Mutual Fund Investment Platform.",
    url: "https://kuvera.in",
    logoFilename: null,
    enabled: false,
    mappingSupported: true,
    symbolMap: {},
    placeholderMap: {
      source: "HDFC Nifty 50 Index Fund Direct Growth",
      mapped: "0P0000XW7T.BO"
    },
    capabilities: {
      instruments: "Mutual Funds, Stocks, Gold",
      coverage: "India",
    },
  },
  {
    id: "vested",
    name: "Vested",
    description: "Helping Indians invest globally with confidence.",
    url: "https://app.vestedfinance.com",
    logoFilename: null,
    enabled: false,
    mappingSupported: false,
    symbolMap: {},
    placeholderMap: {},
    capabilities: {
      instruments: "Stocks, ETFs",
      coverage: "US",
    },
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
        // Preserve user preferences from storage
        enabled: stored.enabled ?? seed.enabled,
        symbolMap: stored.symbolMap ?? seed.symbolMap,
        // Metrics stay at 0 until synced
        assetCount: 0,
        errorCount: 0,
        lastSyncedAt: null,
        lastSyncError: null,
        uniqueErrors: [],
      };
    });

    setBrokers(initializedBrokers);
    setIsLoading(false);
  }, []);

  const updateBroker = (brokerId: string, updates: Partial<BrokerSetting>) => {
    setBrokers((prev) => {
      const next = prev.map((b) => (b.id === brokerId ? { ...b, ...updates } : b));

      // Persist only user-modifiable fields
      const storageData = loadFromStorage();
      const broker = next.find((b) => b.id === brokerId);
      if (broker) {
        storageData[brokerId] = {
          enabled: broker.enabled,
          symbolMap: broker.symbolMap,
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

  return {
    brokers,
    isLoading,
    toggleBroker,
    updateSymbolMap,
    updateBroker,
  };
}
