import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { invokeLola } from '@/services/aiLola';

type Message = { role: 'user' | 'lola'; text: string };

type ChatResult = { message?: string; reply?: string; text?: string };

function responseText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const record = result as ChatResult;
    return record.message ?? record.reply ?? record.text ?? 'I’m here. Tell me a little more.';
  }
  return 'I’m here. Tell me a little more.';
}

export default function AiCoachScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'lola', text: 'I’m here. What feels loud, heavy, or urgent right now?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, text }];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);
    const response = await invokeLola<ChatResult, { messages: Message[]; prompt: string }>({
      mode: 'chat',
      data: { messages: next, prompt: text },
    });
    setLoading(false);
    if (!response.ok) {
      setError(response.error ?? 'Lola could not answer right now.');
      return;
    }
    setMessages((current) => [...current, { role: 'lola', text: responseText(response.result) }]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>AI Coach</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 150 }]} showsVerticalScrollIndicator={false}>
        {messages.map((message, index) => (
          <View key={`${message.role}-${index}`} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.lolaBubble]}>
            <Text style={[styles.bubbleText, message.role === 'user' ? styles.userText : styles.lolaText, { fontFamily: ff.regular }]}>{message.text}</Text>
          </View>
        ))}
        {loading ? <ActivityIndicator color={Colors.primary} style={styles.loader} /> : null}
        {error ? <Text style={[styles.error, { fontFamily: ff.regular }]}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}> 
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Talk to Lola..."
          placeholderTextColor={Colors.textSubtle}
          style={[styles.input, { fontFamily: ff.regular }]}
          multiline
        />
        <Pressable style={({ pressed }) => [styles.send, (!input.trim() || loading) && styles.sendDisabled, pressed && { opacity: 0.75 }]} onPress={send} disabled={!input.trim() || loading} accessibilityRole="button" accessibilityLabel="Send message">
          <MaterialIcons name="arrow-upward" size={20} color={Colors.background} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  bubble: { maxWidth: '86%', borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1 },
  lolaBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderColor: Colors.border },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderColor: Colors.primary },
  bubbleText: { fontSize: FontSizes.base, lineHeight: 24 },
  lolaText: { color: Colors.text },
  userText: { color: Colors.background },
  loader: { marginVertical: Spacing.sm },
  error: { color: Colors.danger, fontSize: FontSizes.sm, lineHeight: 20 },
  composer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.hairline },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.text, backgroundColor: Colors.surface, fontSize: FontSizes.base },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  sendDisabled: { opacity: 0.45 },
});
