import React, { createContext, ReactNode, useContext, useMemo } from 'react';

export interface SessionState {
  user: null;
  isAuthenticated: false;
}

const initialSessionState: SessionState = {
  user: null,
  isAuthenticated: false,
};

export const SessionContext = createContext<SessionState>(initialSessionState);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const session = useMemo(() => initialSessionState, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
