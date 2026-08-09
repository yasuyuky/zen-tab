export interface DuplicateTabCandidate {
  id?: number;
  url?: string;
  lastAccessed?: number;
}

export function getDuplicateTabIds(
  tabs: readonly DuplicateTabCandidate[]
): number[] {
  const tabsByUrl = new Map<string, DuplicateTabCandidate[]>();

  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url) continue;

    const duplicates = tabsByUrl.get(tab.url) ?? [];
    duplicates.push(tab);
    tabsByUrl.set(tab.url, duplicates);
  }

  return Array.from(tabsByUrl.values()).flatMap((duplicates) =>
    duplicates
      .sort(
        (a, b) =>
          (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0) ||
          (b.id ?? 0) - (a.id ?? 0)
      )
      .slice(1)
      .map((tab) => tab.id as number)
  );
}
