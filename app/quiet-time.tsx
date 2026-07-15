import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Companion } from '@/constants/companion';
import { HomeBackButton } from '@/components/ui/HomeBackButton';

// Quiet Time — calm, low-pressure things to do with Lola. Deliberately built
// from plain animation and text (no drawing canvas, no drag puzzles), so nothing
// here can break the way the old mini-games did. No scores, no timers you can
// fail, nothing to get wrong.

type Mode = 'breathe' | 'rest' | 'comfort';

const ACTIVITIES: { key: Mode; title: string; description: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'breathe', title: 'Breathe with Lola', description: 'A slow pace to follow — in, hold, out. Stay as long as you like.', icon: 'air' },
  { key: 'rest', title: 'Rest with Lola', description: 'A few quiet minutes with nothing to do. Lola rests here with you.', icon: 'bedtime' },
  { key: 'comfort', title: 'Comfort cards', description: 'Gentle reminders from Lola, one at a time. Take what helps.', icon: 'favorite' },
];

// Soft, optional haptic. Lazily required so a missing module never crashes.
function haptic(soft = true) {
  try {
    const H = require('expo-haptics');
    H.impactAsync(soft ? H.ImpactFeedbackStyle.Soft : H.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op */
  }
}

export default function QuietTimeScreen() {
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => setMode(null)} style={styles.done} accessibilityRole="button" accessibilityLabel="Done">
            <MaterialIcons name="chevron-left" size={20} color={Colors.primaryLight} />
            <Text style={[styles.doneText, { fontFamily: ff.semibold }]}>Done</Text>
          </Pressable>
          {mode === 'breathe' ? <Breathe /> : mode === 'rest' ? <Rest /> : <Comfort />}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HomeBackButton />
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { fontFamily: ff.bold }]}>Quiet Time</Text>
        <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>A few calm things to do with Lola. No timers to fail, no scores. Leave whenever you like.</Text>
        <View style={styles.lolaBlock}>
          <Image source={Companion.QuietTime} style={styles.lola} resizeMode="contain" />
          <Text style={[styles.caption, { fontFamily: ff.regular }]}>She&apos;s in no rush either.</Text>
        </View>
        {ACTIVITIES.map(a => (
          <Pressable key={a.key} style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => setMode(a.key)} accessibilityRole="button" accessibilityLabel={a.title}>
            <View style={styles.icon}>
              <MaterialIcons name={a.icon} size={24} color={Colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { fontFamily: ff.semibold }]}>{a.title}</Text>
              <Text style={[styles.cardText, { fontFamily: ff.regular }]}>{a.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textSubtle} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Breathe with Lola ────────────────────────────────────────────────────────

type Phase = { label: string; dur: number; to: number };
type Pattern = { key: string; label: string; phases: Phase[] };

const PATTERNS: Pattern[] = [
  { key: 'calm', label: 'Calm', phases: [
    { label: 'Breathe in', dur: 4000, to: 1 },
    { label: 'Breathe out', dur: 6000, to: 0 },
  ] },
  { key: 'box', label: 'Box', phases: [
    { label: 'Breathe in', dur: 4000, to: 1 },
    { label: 'Hold', dur: 4000, to: 1 },
    { label: 'Breathe out', dur: 4000, to: 0 },
    { label: 'Rest', dur: 4000, to: 0 },
  ] },
  { key: '478', label: '4·7·8', phases: [
    { label: 'Breathe in', dur: 4000, to: 1 },
    { label: 'Hold', dur: 7000, to: 1 },
    { label: 'Breathe out', dur: 8000, to: 0 },
  ] },
];

function Breathe() {
  const ff = useFontFamily();
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('Ready when you are');
  const breath = useRef(new Animated.Value(0)).current;
  const idxRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The breathing loop: each phase eases the orb toward its target and, after its
  // duration, moves to the next. Pure timing — nothing to desync or leak.
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      const phase = pattern.phases[idxRef.current % pattern.phases.length];
      setLabel(phase.label);
      haptic(true);
      Animated.timing(breath, { toValue: phase.to, duration: phase.dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
      timeoutRef.current = setTimeout(() => {
        idxRef.current = (idxRef.current + 1) % pattern.phases.length;
        step();
      }, phase.dur);
    };
    step();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      breath.stopAnimation();
    };
  }, [running, pattern, breath]);

  function toggle() {
    if (running) {
      // The effect cleanup stops the orb where it is; leave it paused there.
      setRunning(false);
      setLabel('Paused');
    } else {
      idxRef.current = 0;
      setRunning(true);
    }
  }

  function choosePattern(p: Pattern) {
    idxRef.current = 0;
    setPattern(p);
  }

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.66, 1.1] });
  const glow = breath.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] });

  return (
    <View style={styles.activity}>
      <Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Breathe with Lola</Text>
      <Text style={[styles.help, { fontFamily: ff.regular }]}>Follow the circle — in as it grows, out as it settles.</Text>

      <View style={styles.chipRow}>
        {PATTERNS.map(p => {
          const on = p.key === pattern.key;
          return (
            <Pressable key={p.key} onPress={() => choosePattern(p)} style={[styles.choice, on && styles.choiceOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.choiceText, on && styles.choiceTextOn, { fontFamily: ff.semibold }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.breatheStage}>
        <Animated.View pointerEvents="none" style={[styles.breatheGlow, { opacity: glow, transform: [{ scale }] }]} />
        <Animated.View pointerEvents="none" style={[styles.breatheOrb, { transform: [{ scale }] }]} />
        <Text style={[styles.breatheLabel, { fontFamily: ff.semibold }]}>{label}</Text>
      </View>

      <Image source={Companion.QuietTime} style={styles.breatheLola} resizeMode="contain" />

      <Pressable onPress={toggle} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} accessibilityRole="button">
        <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={20} color={Colors.background} />
        <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>{running ? 'Pause' : 'Begin'}</Text>
      </Pressable>
    </View>
  );
}

// ── Rest with Lola ───────────────────────────────────────────────────────────

const REST_OPTIONS = [2, 5, 10];

function Rest() {
  const ff = useFontFamily();
  const reduceMotion = useReducedMotion();
  const [minutes, setMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const sway = useRef(new Animated.Value(0)).current;

  // Countdown — a plain 1s tick while running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          setDone(true);
          haptic(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // A barely-there breath on Lola while she rests.
  useEffect(() => {
    if (reduceMotion || !running) {
      sway.stopAnimation();
      sway.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, running, sway]);

  function pick(m: number) {
    setMinutes(m);
    setSecondsLeft(m * 60);
    setDone(false);
    setRunning(false);
  }

  function toggle() {
    if (done) {
      setSecondsLeft(minutes * 60);
      setDone(false);
      setRunning(true);
      return;
    }
    setRunning(r => !r);
  }

  function reset() {
    setRunning(false);
    setDone(false);
    setSecondsLeft(minutes * 60);
  }

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const scale = sway.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <View style={styles.activity}>
      <Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Rest with Lola</Text>
      <Text style={[styles.help, { fontFamily: ff.regular }]}>Put the phone down if you like. There&apos;s nothing to do here but rest.</Text>

      <View style={styles.chipRow}>
        {REST_OPTIONS.map(m => {
          const on = m === minutes;
          return (
            <Pressable key={m} onPress={() => pick(m)} disabled={running} style={[styles.choice, on && styles.choiceOn, running && styles.choiceDim]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.choiceText, on && styles.choiceTextOn, { fontFamily: ff.semibold }]}>{m} min</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.Image source={Companion.Flare} style={[styles.restLola, { transform: [{ scale }] }]} resizeMode="contain" />

      <Text style={[styles.restTimer, { fontFamily: ff.bold }]}>
        {done ? 'Rest complete' : `${mm}:${String(ss).padStart(2, '0')}`}
      </Text>
      <Text style={[styles.restMsg, { fontFamily: ff.regular }]}>
        {done ? 'That was time just for you. Nothing else needed.' : running ? 'Breathe. You don’t have to be anywhere.' : 'Whenever you’re ready.'}
      </Text>

      <View style={styles.restButtons}>
        <Pressable onPress={toggle} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} accessibilityRole="button">
          <MaterialIcons name={done ? 'replay' : running ? 'pause' : 'play-arrow'} size={20} color={Colors.background} />
          <Text style={[styles.primaryBtnText, { fontFamily: ff.semibold }]}>{done ? 'Rest again' : running ? 'Pause' : 'Begin'}</Text>
        </Pressable>
        {!done && secondsLeft !== minutes * 60 ? (
          <Pressable onPress={reset} style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={[styles.ghostBtnText, { fontFamily: ff.semibold }]}>Reset</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ── Comfort cards ────────────────────────────────────────────────────────────

const COMFORTS = [
  'Resting is doing something. Your body is working hard.',
  'You got through yesterday. That counts.',
  'You don’t have to earn rest.',
  'Surviving a hard day is an achievement, even if no one sees it.',
  'Your worth isn’t measured in tasks.',
  'It’s okay to do less today.',
  'Pain is tiring. Be as gentle with yourself as you’d be with a friend.',
  'You are not behind. You’re on your own timeline.',
  'Small things count. A glass of water counts.',
  'You’re allowed to take up space, exactly as you are.',
  'You’re doing your best with a body that makes it hard. That’s enough.',
  'The next hour can be a fresh start. So can the next minute.',
  'You don’t have to be productive to be worthy of care.',
  'Whatever got done today, got done. That’s enough.',
];

function pickNext(cur: number, len: number): number {
  if (len <= 1) return cur;
  let n = cur;
  while (n === cur) n = Math.floor(Math.random() * len);
  return n;
}

function Comfort() {
  const ff = useFontFamily();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * COMFORTS.length));
  const fade = useRef(new Animated.Value(1)).current;

  const another = useCallback(() => {
    Animated.timing(fade, { toValue: 0, duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() => {
      setIndex(cur => pickNext(cur, COMFORTS.length));
      haptic(true);
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    });
  }, [fade]);

  return (
    <View style={styles.activity}>
      <Text style={[styles.detailTitle, { fontFamily: ff.bold }]}>Comfort cards</Text>
      <Text style={[styles.help, { fontFamily: ff.regular }]}>One gentle thing at a time. Tap for another whenever you want.</Text>

      <Image source={Companion.Struggling} style={styles.comfortLola} resizeMode="contain" />

      <Pressable onPress={another} accessibilityRole="button" accessibilityLabel="Another comfort card">
        <Animated.View style={[styles.comfortCard, { opacity: fade }]}>
          <MaterialIcons name="format-quote" size={22} color={Colors.primaryLight} />
          <Text style={[styles.comfortText, { fontFamily: ff.semibold }]}>{COMFORTS[index]}</Text>
        </Animated.View>
      </Pressable>

      <Pressable onPress={another} style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]} accessibilityRole="button">
        <MaterialIcons name="refresh" size={18} color={Colors.primaryLight} />
        <Text style={[styles.ghostBtnText, { fontFamily: ff.semibold }]}>Another</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  title: { color: Colors.text, fontSize: FontSizes.xxl },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 26 },
  lolaBlock: { alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md },
  lola: { width: 92, height: 112 },
  caption: { color: Colors.textSubtle, textAlign: 'center', fontSize: FontSizes.sm },
  card: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  pressed: { opacity: 0.8 },
  icon: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.accentFaint, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: Colors.text, fontSize: FontSizes.md },
  cardText: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 21 },

  detail: { padding: Spacing.lg, paddingBottom: 80 },
  done: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: Spacing.sm, paddingRight: Spacing.md },
  doneText: { color: Colors.primaryLight, fontSize: FontSizes.base },
  activity: { alignItems: 'center', gap: Spacing.md },
  detailTitle: { color: Colors.text, fontSize: FontSizes.xl, textAlign: 'center', marginTop: Spacing.sm },
  help: { color: Colors.textMuted, lineHeight: 22, textAlign: 'center', paddingHorizontal: Spacing.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  choice: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: 9 },
  choiceOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  choiceDim: { opacity: 0.5 },
  choiceText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  choiceTextOn: { color: Colors.background },

  // Breathe
  breatheStage: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  breatheGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary },
  breatheOrb: { position: 'absolute', width: 168, height: 168, borderRadius: 84, backgroundColor: Colors.primaryFaint, borderWidth: 1.5, borderColor: Colors.primaryLight },
  breatheLabel: { color: Colors.text, fontSize: FontSizes.lg },
  breatheLola: { width: 96, height: 116 },

  // Rest
  restLola: { width: 150, height: 168, marginTop: Spacing.sm },
  restTimer: { color: Colors.text, fontSize: FontSizes.xxxl, letterSpacing: 1 },
  restMsg: { color: Colors.textMuted, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.md },
  restButtons: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },

  // Comfort
  comfortLola: { width: 120, height: 138, marginTop: Spacing.sm },
  comfortCard: { minHeight: 150, width: 300, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  comfortText: { color: Colors.text, fontSize: FontSizes.lg, textAlign: 'center', lineHeight: 30 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.xs },
  primaryBtnText: { color: Colors.background, fontSize: FontSizes.base },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 11 },
  ghostBtnText: { color: Colors.primaryLight, fontSize: FontSizes.sm },
});
