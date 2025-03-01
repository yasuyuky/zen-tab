import React from 'react';
import { TabGroup as ITabGroup, TabInfo } from '../types';
import { TabItem } from './TabItem';
import { TabGroupWrapper, GroupTitle, GroupCloseButton } from '../styles';

interface TabGroupProps {
  group: ITabGroup;
  showFavicon: boolean;
  selectedTabId: number | null;
  isHistory?: boolean;
  onSelectTab: (tab: TabInfo) => void;
  onCloseTab: (tab: TabInfo) => void;
  onCloseGroup: () => void;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  group,
  showFavicon,
  selectedTabId,
  isHistory,
  onSelectTab,
  onCloseTab,
  onCloseGroup,
}) => {
  const hasClosableTabs = isHistory || group.tabs.some(tab => !tab.pinned);

  return (
    <TabGroupWrapper>
      <GroupTitle>
        <span>{group.title}</span>
        {hasClosableTabs && (
          <GroupCloseButton onClick={onCloseGroup}>×</GroupCloseButton>
        )}
      </GroupTitle>
      {group.tabs.map(tab => (
        <TabItem
          key={tab.id || tab.url}
          tab={tab}
          selected={tab.id === selectedTabId}
          showFavicon={showFavicon}
          isHistory={isHistory}
          isPinned={tab.pinned}
          onSelect={() => onSelectTab(tab)}
          onClose={() => onCloseTab(tab)}
        />
      ))}
    </TabGroupWrapper>
  );
};
