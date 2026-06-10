'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ActiveSpaceContextValue = {
  spaceId: string | null;
  title: string | null;
  setActiveSpace: (spaceId: string, title?: string) => void;
  clearActiveSpace: () => void;
};

const ActiveSpaceContext = createContext<ActiveSpaceContextValue | null>(null);

export function ActiveSpaceProvider({ children }: { children: ReactNode }) {
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  const setActiveSpace = useCallback((id: string, spaceTitle?: string) => {
    setSpaceId(id);
    setTitle(spaceTitle ?? null);
  }, []);

  const clearActiveSpace = useCallback(() => {
    setSpaceId(null);
    setTitle(null);
  }, []);

  const value = useMemo(
    () => ({ spaceId, title, setActiveSpace, clearActiveSpace }),
    [spaceId, title, setActiveSpace, clearActiveSpace],
  );

  return (
    <ActiveSpaceContext.Provider value={value}>
      {children}
    </ActiveSpaceContext.Provider>
  );
}

export function useActiveSpace() {
  const ctx = useContext(ActiveSpaceContext);
  if (!ctx) {
    throw new Error('useActiveSpace must be used within ActiveSpaceProvider');
  }
  return ctx;
}
