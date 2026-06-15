import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Hassle — top-level error boundary.
 *
 * In a release/preview build an uncaught error during render or in a lifecycle
 * method does NOT show React Native's red box — it calls RCTFatal and aborts the
 * whole app (the "crash straight after the splash" we were chasing). This
 * boundary catches those errors and shows Lola plus the actual message and
 * component stack, so a startup problem is visible and screenshot-able instead
 * of a silent crash.
 *
 * Note: this only catches errors thrown during React rendering/lifecycle. Errors
 * inside async callbacks (promises, setTimeout) and native modules are not caught
 * here — but turning every render-time throw into a readable screen removes the
 * single biggest class of silent startup crashes.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: { componentStack?: string } | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Keep the stack around for the on-screen report.
    this.setState({ info });
    // Also log it so it shows in any attached console / device logs.
    console.error('Hassle caught a startup error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    const { error, info } = this.state;
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
            <Text style={styles.label}>Error</Text>
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
