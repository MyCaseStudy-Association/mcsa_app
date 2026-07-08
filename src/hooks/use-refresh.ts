import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh state. Runs an optional async task and keeps the spinner
 * visible for at least a moment so the gesture reads as intentional.
 */
export function useRefresh(task?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      Promise.resolve().then(() => task?.()),
      new Promise((resolve) => setTimeout(resolve, 700)),
    ]).finally(() => setRefreshing(false));
  }, [task]);

  return { refreshing, onRefresh };
}
