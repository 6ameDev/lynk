type AnyRow = Record<string, any>;

export function normalizeColumns<T extends AnyRow>(
  rows: T[]
): Record<string, any>[] {
  if (!rows.length) return [];

  return rows.map((row) => {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      const normKey = normalizeKey(key);
      normalized[normKey] = value;
    }

    return normalized;
  });
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    // replace anything not alphanumeric with underscore
    .replace(/[^a-z0-9]+/g, "_")
    // remove leading/trailing underscores
    .replace(/^_+|_+$/g, "");
}
