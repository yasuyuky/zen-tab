import React from 'react';
import { TabGroup as ITabGroup, TabInfo } from '../types';
import { TabItem } from './TabItem';
import { TabGroupWrapper, GroupTitle, GroupCloseButton } from '../styles';

interface TabGroupProps {
  group: ITabGroup;
  showFavicon: boolean;
  selectedIndex: number;
  flattenedIndex: (index: number) => number;
  isHistory?: boolean;
  onSelectTab: (tab: TabInfo) => void;
  onCloseTab: (tab: TabInfo) => void;
  onCloseGroup: () => void;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  group,
  showFavicon,
  selectedIndex,
  flattenedIndex,
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
      {group.tabs.map((tab, index) => (
        <TabItem
          key={tab.id || tab.url}
          tab={tab}
          selected={selectedIndex === flattenedIndex(index)}
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
