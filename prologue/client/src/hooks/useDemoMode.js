import { useMemo, useEffect } from 'react';
import { useAuth } from './useAuth';

export const DEMO_EMPLOYEE_ID = 'PRO-2024-00001';

export function useDemoMode() {
  const { user } = useAuth();
  const isDemo = user?.employee_id === DEMO_EMPLOYEE_ID;

  const overrides = useMemo(
    () =>
      isDemo
        ? {
            streak: 47,
            activeMonths: 3,
            completedProjects: 2,
          }
        : null,
    [isDemo]
  );

  useEffect(() => {
    if (isDemo) {
      try {
        localStorage.setItem(
          'prologue_demo_overrides',
          JSON.stringify({ streak: 47, activeMonths: 3, completedProjects: 2 })
        );
      } catch (_) {}
    }
  }, [isDemo]);

  return { isDemo, overrides };
}
