import { useCallback, useRef } from 'react';

export function useHaptics() {
  const lastTriggerRef = useRef<number>(0);
  const supported = typeof window !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback(
    (pattern: number | number[], throttleMs = 600) => {
      if (!supported) return;
      const now = Date.now();
      if (now - lastTriggerRef.current < throttleMs) return;
      navigator.vibrate(pattern);
      lastTriggerRef.current = now;
    },
    [supported]
  );

  return { supported, vibrate };
}
