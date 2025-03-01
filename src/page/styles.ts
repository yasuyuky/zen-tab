import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --bg-color: #ffffff;
    --text-color: #333333;
    --border-color: #cccccc;
    --container-bg: rgba(255, 255, 255, 0.1);
    --search-bg: rgba(255, 255, 255, 0.2);
    --hover-bg: #f0f0f0;
    --selected-bg: #f0f0f0;
    --accent-color: #0060df;
  }

  [data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #404040;
    --container-bg: rgba(0, 0, 0, 0.2);
    --search-bg: rgba(0, 0, 0, 0.3);
    --hover-bg: #2b2b2b;
    --selected-bg: #2b2b2b;
  }

  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
  }
`;

export const SearchContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--search-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 16px 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

export const SearchInner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--accent-color);
    border-color: var(--accent-color);
  }
`;

export const ScrollContainer = styled.div`
  position: fixed;
  top: 120px;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
`;

export const TabGroupsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
  background: var(--container-bg);
  backdrop-filter: blur(4px);
`;

export const TabGroupWrapper = styled.div`
  margin-bottom: 24px;
`;

export const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color);
  font-size: 14px;
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const GroupCloseButton = styled.span`
  padding: 4px 8px;
  cursor: pointer;
  opacity: 0.6;
  font-size: 16px;

  &:hover {
    opacity: 1;
  }
`;

export const TabItemWrapper = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  min-height: 20px;
  background-color: ${props => props.selected ? 'var(--selected-bg)' : 'transparent'};
  outline: ${props => props.selected ? '2px solid var(--accent-color)' : 'none'};

  &:hover {
    background-color: var(--hover-bg);
  }
`;

export const TabFavicon = styled.img`
  margin-right: 8px;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
`;

export const TabContent = styled.div`
  flex-grow: 1;
  min-width: 0;
`;

export const TabTitle = styled.span`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
`;

export const TabUrl = styled.div`
  color: var(--text-color);
  opacity: 0.6;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
`;

export const TabCloseButton = styled.span`
  padding: 4px 8px;
  margin: -4px -8px -4px 0;
  cursor: pointer;
  opacity: 0.6;
  font-size: 16px;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 1;
  }
`;

export const ModeIndicator = styled.div`
  margin-bottom: 10px;

  span {
    margin-right: 5px;
    cursor: pointer;

    &.current-mode {
      font-weight: bold;
      color: inherit;
    }
  }
`;
