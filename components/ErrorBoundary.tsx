import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Hassle — top-level error + global crash guard.
 *
 * In a release/preview build an uncaught error does NOT show React Native's red
 * box — React Native reports it to the native ExceptionsManager, which calls
 * RCTFatal and aborts the whole app (the "crash straight after the splash" we
 * were chasing, visible in crash reports as an abort on
 * `com.facebook.react.ExceptionsManagerQueue`).
 *
 * React error boundaries only catch errors thrown during *render / lifecycle*.
 * The startup crash is an error thrown in *async* code (a promise/callback in a
 * provider's effect), which a boundary can't see. So this component does TWO
 * things:
 *
 *   1. componentDidCatch — catches render/lifecycle errors (boundary behaviour).
 *   2. ErrorUtils.setGlobalHandler — installs a global JS error handler that
 *      catches EVERYTHING else (async throws, the ones that were aborting the
 *      app). Instead of letting RN call RCTFatal, we show the real message on
 *      screen. That turns the silent abort into a readable, screenshot-able
 *      error — and if the error was non-critical, the app simply keeps running.
 *
 * This is intentionally a "show, don't die" net while we stabilise the beta. The
 * real message it surfaces tells us exactly what to fix.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: { componentStack?: string } | null;
  source: 'render' | 'global' | null;
}

// React Native exposes ErrorUtils as a global; it isn't in the TS lib types.
type GlobalErrorHandler = (error: any, isFatal?: boolean) => void;
interface ErrorUtilsShape {
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
}
function getErrorUtils(): ErrorUtilsShape | undefined {
  return (globalThis as any)?.ErrorUtils as ErrorUtilsShape | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, source: null };
  private mounted = false;
  private prevHandler: GlobalErrorHandler | undefined;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, source: 'render' };
  }

  componentDidMount() {
    this.mounted = true;
    const EU = getErrorUtils();
    if (EU?.setGlobalHandler) {
      this.prevHandler = EU.getGlobalHandler?.();
      EU.setGlobalHandler((error: any, isFatal?: boolean) => {
        // Log first, in case anything below throws.
        // eslint-disable-next-line no-console
        console.error('Hassle global error:', isFatal ? '(fatal)' : '', error);
        // Show it instead of letting RN call RCTFatal and abort. We deliberately
        // do NOT call the previous (default) handler — that's the one that aborts.
        const err =
          error instanceof Error ? error : new Error(String(error?.message ?? error));
        if (this.mounted) {
          this.setState({ error: err, source: 'global', info: null });
        }
      });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    // Restore the original handler if we replaced it.
    const EU = getErrorUtils();
    if (this.prevHandler && EU?.setGlobalHandler) {
      EU.setGlobalHandler(this.prevHandler);
    }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Keep the stack around for the on-screen report.
    this.setState({ info });
    // Also log it so it shows in any attached console / device logs.
    console.error('Hassle caught a startup error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null, info: null, source: null });
  };

  render() {
    const { error, info, source } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>💜</Text>
          <Text style={styles.title}>Hassle hit a snag</Text>
          <Text style={styles.subtitle}>
            Something went wrong while starting up. This screen is here so we can
            see exactly what — please screenshot it.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>
              Error{source ? ` · ${source}` : ''}
            </Text>
            <Text style={styles.message}>
              {error.name}: {error.message}
            </Text>
          </View>

          {error.stack ? (
            <View style={styles.card}>
              <Text style={styles.label}>Stack</Text>
              <Text style={styles.mono}>{error.stack}</Text>
            </View>
          ) : null}

          {info?.componentStack ? (
            <View style={styles.card}>
              <Text style={styles.label}>Component stack</Text>
              <Text style={styles.mono}>{info.componentStack}</Text>
            </View>
          ) : null}

          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 80, gap: 16 },
  emoji: { fontSize: 40, textAlign: 'center' },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  label: { color: Colors.textSubtle, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  message: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  mono: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Courier' },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
});
