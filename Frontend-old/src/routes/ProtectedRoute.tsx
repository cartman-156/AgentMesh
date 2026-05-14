import type { ReactNode } from 'react';
import { useSession } from '../context/SessionContext';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const session = useSession();

  // Placeholder wrapper for future access control.
  // All routes remain public until auth is implemented.
  return <>{children}</>;
};

export default ProtectedRoute;
