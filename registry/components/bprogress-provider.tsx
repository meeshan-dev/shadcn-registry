import { ProgressProvider, useProgress } from '@bprogress/react';
import { useEffect } from 'react';
import { useNavigation } from 'react-router';

export function BProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider options={{ showSpinner: false }}>
      {children}

      <ManipulateProgress />
    </ProgressProvider>
  );
}

function ManipulateProgress() {
  const { start, stop } = useProgress();

  const { state } = useNavigation();

  useEffect(() => {
    if (state === 'loading') {
      start();
    } else {
      stop();
    }
  }, [start, state, stop]);

  return null;
}
