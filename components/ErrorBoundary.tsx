import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import {
  getLastStartupError,
  subscribeStartupError,
  clearStartupError,
} from '@/services/earlyErrorGuard';

/**
 * Hassle — top-level error + global crash guard (UI side).
 *
 * In a release/preview build an uncaught error does NOT show React Native's red
 * box — React Native reports it to the native ExceptionsManager, which calls
 * RCTFatal and aborts the whole app (the "crash straight after the splash" we
 * were chasing, visible in crash reports as an abort on
 * `com.facebook.react.ExceptionsManagerQueue`).
 *
 * React error boundaries only catch errors thrown during *render / lifecycle*.
 * The startup crash is an error thrown in *async* code (a promise/callback in a
 * provider's effect), or even before the UI mounts — which a boundary can't see.
 *
 * The global JS error handler is installed at the app entry point, as early as
 * possible (see services/earlyErrorGuard.ts + index.js). This component is the
 * *display* half: it
 *
 *   1. catches render/lifecycle errors via componentDidCatch (boundary), and
 *   2. shows any error the early guard captured (async / pre-mount errors),
 *      reading the last one on mount and subscribing for new ones.
 *
 * "Show, don't die" net for the beta — the message it surfaces tells us exactly
 * what to fix.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: { componentStack?: string } | null;
  source: 'render' | 'global' | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, source: null };
  private mounted = false;
  private unsubscribe?: () => void;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, source: 'render' };
  }

  componentDidMount() {
    this.mounted = true;
    // Show anything the early guard already captured before the UI mounted.
    const existing = getLastStartupError();
    if (existing) {
      this.setState({ error: existing, source: 'global', info: null });
    }
    // And subscribe for any that arrive later (async startup errors).
    this.unsubscribe = subscribeStartupError((err) => {
      if (this.mounted) {
        this.setState((prev) =>
          prev.error ? prev : { error: err, source: 'global', info: null }
        );
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribe?.();
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Keep the stack around for the on-screen report.
    this.setState({ info });
    // Also log it so it shows in any attached console / device logs.
    console.error('Hassle caught a startup error:', error, info?.componentStack);
  }

  handleReset = () => {
    clearStartupError();
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
