/**
 * Hassle — earliest-possible global JS error guard.
 *
 * This module installs a global JavaScript error handler at IMPORT time, and is
 * imported as the very first thing in the app entry (see index.js) — before any
 * screen, provider or context module loads. That timing matters: in a
 * release/preview build an uncaught JS error during startup is reported to the
 * native ExceptionsManager, which calls RCTFatal and ABORTS the app (the
 * "crash right after the splash"). Crash reports show this as an abort on
 * `com.facebook.react.ExceptionsManagerQueue`.
 *
 * By replacing RN's default global handler this early, we intercept those
 * errors, remember the most recent one, and notify any listener (the on-screen
 * ErrorBoundary) — and we deliberately do NOT call the default handler, so the
 * app shows the real message instead of aborting.
 *
 * This is a "show, don't die" net for the beta. The message it surfaces tells us
 * exactly what to fix.
 */

type Listener = (error: Error) => void;

let lastError: Error | null = null;
const listeners = new Set<Listener>();

export function getLastStartupError(): Error | null {
  return lastError;
}

export function subscribeStartupError(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function clearStartupError(): void {
  lastError = null;
}

function toError(value: any): Error {
  if (value instanceof Error) return value;
  try {
    return new Error(typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

// Best-effort: drop the native splash so a very-early error (before any React
// component mounts) can't leave the app frozen on the splash screen. Safe to
// call even if the splash is already hidden.
function hideSplashSafely(): void {
  try {
    const Splash = require('expo-splash-screen');
    Splash?.hideAsync?.().catch(() => {});
  } catch {
    // expo-splash-screen not available — ignore
  }
}

// Install immediately on import.
(() => {
  const EU = (globalThis as any)?.ErrorUtils;
  if (!EU || typeof EU.setGlobalHandler !== 'function') return;

  EU.setGlobalHandler((error: any, isFatal?: boolean) => {
    const err = toError(error);
    lastError = err;
    try {
      // eslint-disable-next-line no-console
      console.error('Hassle startup error', isFatal ? '(fatal)' : '', err?.message, err?.stack);
    } catch {
      // ignore logging failures
    }
    hideSplashSafely();
    listeners.forEach((l) => {
      try {
        l(err);
      } catch {
        // a listener throwing must never re-trigger the handler
      }
    });
    // NOTE: intentionally not calling the previous handler — that is the one
    // that calls RCTFatal and aborts the process in release builds.
  });
})();
