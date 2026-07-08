import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type PromiseLikeBoolean = {
  then: (onFulfilled: (value: boolean) => void) => { catch?: (onRejected: () => void) => unknown } | unknown;
};

function isPromiseLikeBoolean(value: unknown): value is PromiseLikeBoolean {
  return Boolean(value && typeof (value as { then?: unknown }).then === 'function');
}

/**
 * Safely reads the platform reduced-motion preference.
 *
 * This hook intentionally defaults to `false` and treats the platform API as
 * optional. If the native/web accessibility implementation is missing, rejects,
 * or returns a non-promise value, render continues and animations can simply run.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    try {
      const getter = AccessibilityInfo.isReduceMotionEnabled;
      if (typeof getter === 'function') {
        const result = getter();
        if (isPromiseLikeBoolean(result)) {
          const chain = result.then((enabled) => {
            if (mounted) setReduceMotion(Boolean(enabled));
          });
          if (chain && typeof (chain as { catch?: unknown }).catch === 'function') {
            (chain as { catch: (onRejected: () => void) => unknown }).catch(() => {
              if (mounted) setReduceMotion(false);
            });
          }
        }
      }
    } catch {
      if (mounted) setReduceMotion(false);
    }

    let subscription: { remove?: () => void } | undefined;
    try {
      const addEventListener = AccessibilityInfo.addEventListener;
      if (typeof addEventListener === 'function') {
        subscription = addEventListener('reduceMotionChanged', (enabled: boolean) => {
          if (mounted) setReduceMotion(Boolean(enabled));
        });
      }
    } catch {
      subscription = undefined;
    }

    return () => {
      mounted = false;
      try {
        subscription?.remove?.();
      } catch {
        // Ignore cleanup failures; reduced-motion support must never affect app startup.
      }
    };
  }, []);

  return reduceMotion;
}
