import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { canManageStaff, canViewAnalytics, canViewDebts, getHomePath } from '../lib/permissions';

/** Только директор: аналитика, аудит. */
export function DirectorOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canViewAnalytics(user)) return <Navigate to="/products" replace />;
  return <>{children}</>;
}

/** Только рабочие: товары. */
export function WorkerOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'worker') return <Navigate to="/analytics" replace />;
  return <>{children}</>;
}

/** Директор или рабочий: склад / товары. */
export function DirectorOrWorker({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'director' && user.role !== 'worker' && user.role !== 'assistant') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePath(user)} replace />;
}


export function StaffManagerOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageStaff(user)) return <Navigate to="/products" replace />;
  return <>{children}</>;
}


export function DebtsVisibleOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'director' && user.role !== 'worker' && user.role !== 'assistant') return <Navigate to="/login" replace />;
  if (!canViewDebts(user)) return <Navigate to="/products" replace />;
  return <>{children}</>;
}
