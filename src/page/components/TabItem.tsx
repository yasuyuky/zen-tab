import React, { useEffect, useRef } from 'react';
import { TabItemWrapper, TabFavicon, TabContent, TabTitle, TabUrl, TabCloseButton } from '../styles';
import { TabInfo } from '../types';

interface TabItemProps {
  tab: TabInfo;
  selected: boolean;
  showFavicon: boolean;
  isHistory?: boolean;
  onSelect: () => void;
  onClose: () => void;
  isPinned?: boolean;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  selected,
  showFavicon,
  isHistory,
  onSelect,
  onClose,
  isPinned,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selected]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <TabItemWrapper
      ref={itemRef}
      selected={selected}
      onClick={onSelect}
      className={isPinned ? 'pinned' : ''}
    >
      {showFavicon && tab.favIconUrl && (
        <TabFavicon src={tab.favIconUrl} width={16} height={16} />
      )}
      <TabContent>
        <TabTitle>{tab.title}</TabTitle>
        {isHistory && <TabUrl>{tab.url}</TabUrl>}
      </TabContent>
      {(!isPinned || isHistory) && (
        <TabCloseButton onClick={handleClose}>×</TabCloseButton>
      )}
    </TabItemWrapper>
  );
};
