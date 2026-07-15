import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { BackButton } from '@/components/ui/BackButton';
import { addLookingForward, loadLookingForward, LookingForwardItem, removeLookingForward } from '@/services/lookingForward';

export default function LookingForwardScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [items, setItems] = useState<LookingForwardItem[]>([]);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(() => {
    loadLookingForward().then(list => setItems([...list].reverse()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function add() {
    const text = title.trim();
    if (!text || adding) return;
    setAdding(true);
    try {
      await addLookingForward(text, undefined, when.trim() || null);
      setTitle('');
      setWhen('');
      refresh();
    } finally {
      setAdding(false);
    }
  }

  function confirmRemove(item: LookingForwardItem) {
    Alert.alert('Remove this?', item.title, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeLookingForward(item.id).then(() => refresh()) },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Looking forward</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Looking forward to</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>
            Nice things ahead — a wedding you’re hoping to make, a project, a plan. Something to hold onto.
          </Text>
        </View>

        <View style={styles.card}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Something to look forward to…"
            placeholderTextColor={Colors.textSubtle}
            style={[styles.input, { fontFamily: ff.regular }]}
          />
          <TextInput
            value={when}
            onChangeText={setWhen}
            placeholder="When? (optional — e.g. “June”, “someday”)"
            placeholderTextColor={Colors.textSubtle}
            style={[styles.input, styles.inputWhen, { fontFamily: ff.regular }]}
          />
          <Pressable
            style={({ pressed }) => [styles.addButton, !title.trim() && styles.addButtonDisabled, pressed && !!title.trim() && styles.pressed]}
            onPress={add}
            disabled={!title.trim() || adding}
            accessibilityRole="button"
            accessibilityLabel="Add"
          >
            <MaterialIcons name="add" size={18} color={Colors.background} />
            <Text style={[styles.addButtonText, { fontFamily: ff.semibold }]}>Add</Text>
          </Pressable>
        </View>

        {items.map(item => (
          <View key={item.id} style={styles.item}>
            <MaterialIcons name="favorite" size={16} color={Colors.primaryLight} style={{ marginTop: 3 }} />
            <View style={styles.itemText}>
              <Text style={[styles.itemTitle, { fontFamily: ff.semibold }]}>{item.title}</Text>
              {item.date ? <Text style={[styles.itemWhen, { fontFamily: ff.regular }]}>{item.date}</Text> : null}
            </View>
            <Pressable onPress={() => confirmRemove(item)} hitSlop={10} accessibilityLabel="Remove">
              <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
            </Pressable>
          </View>
        ))}

        {items.length === 0 ? (
          <Text style={[styles.empty, { fontFamily: ff.regular }]}>Nothing here yet — add one nice thing when it comes to mind.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  intro: { gap: Spacing.xs, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: FontSizes.xxxl, lineHeight: 44, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, color: Colors.text, fontSize: FontSizes.base, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  inputWhen: { fontSize: FontSizes.sm },
  addButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 10, marginTop: Spacing.xs },
  addButtonDisabled: { opacity: 0.42 },
  addButtonText: { color: Colors.background, fontSize: FontSizes.base },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  itemText: { flex: 1 },
  itemTitle: { color: Colors.text, fontSize: FontSizes.base, lineHeight: 22 },
  itemWhen: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
  empty: { color: Colors.textSubtle, fontSize: FontSizes.sm, textAlign: 'center', paddingTop: Spacing.md },
  pressed: { opacity: 0.75 },
});
