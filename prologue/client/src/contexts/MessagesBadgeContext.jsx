import { createContext, useContext, useState, useCallback } from 'react';
import { hasMessagesBadge, clearMessagesBadge as clearStorage } from '../lib/botScheduler';

const MessagesBadgeContext = createContext(null);

export function MessagesBadgeProvider({ children }) {
  const [badge, setBadge] = useState(() => hasMessagesBadge());

  const refreshMessagesBadge = useCallback(() => {
    setBadge(hasMessagesBadge());
  }, []);

  const clearMessagesBadge = useCallback(() => {
    clearStorage();
    setBadge(false);
  }, []);

  return (
    <MessagesBadgeContext.Provider value={{ messagesBadge: badge, refreshMessagesBadge, clearMessagesBadge }}>
      {children}
    </MessagesBadgeContext.Provider>
  );
}

export function useMessagesBadge() {
  const ctx = useContext(MessagesBadgeContext);
  return ctx ?? { messagesBadge: false, refreshMessagesBadge: () => {}, clearMessagesBadge: () => {} };
}
