export interface TabGroupCandidate {
  id?: number;
  url?: string;
  title?: string;
}

export interface TabGroupPlan {
  title: string;
  tabIds: number[];
}

type GroupableTab = TabGroupCandidate & { id: number; url: string };

function isGroupableTab(tab: TabGroupCandidate): tab is GroupableTab {
  return tab.id !== undefined && Boolean(tab.url);
}

function getSortedTabIds(tabs: GroupableTab[]): number[] {
  return [...tabs]
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
    .map((tab) => tab.id);
}

export function createTabGroupPlans(
  tabs: readonly TabGroupCandidate[]
): TabGroupPlan[] {
  const tabsByHost = new Map<string, GroupableTab[]>();
  const others: GroupableTab[] = [];

  for (const tab of tabs) {
    if (!isGroupableTab(tab)) continue;

    let hostname: string;
    try {
      hostname = new URL(tab.url).hostname;
    } catch {
      others.push(tab);
      continue;
    }

    if (!hostname) {
      others.push(tab);
      continue;
    }

    const hostTabs = tabsByHost.get(hostname) ?? [];
    hostTabs.push(tab);
    tabsByHost.set(hostname, hostTabs);
  }

  const plans: TabGroupPlan[] = [];
  for (const [hostname, hostTabs] of tabsByHost) {
    if (hostTabs.length > 1) {
      plans.push({ title: hostname, tabIds: getSortedTabIds(hostTabs) });
    } else {
      others.push(hostTabs[0]);
    }
  }

  if (others.length > 0) {
    plans.push({ title: "others", tabIds: getSortedTabIds(others) });
  }

  return plans;
}
