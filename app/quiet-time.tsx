import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  AccessibilityInfo,
  Image,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';

// ─── Types ────────────────────────────────────────────────────────────────────

type Activity = {
  key: string;
  title: string;
  description: string;
  effort: string;
  accentColor: string;
  implemented: boolean;
};

// ─── Activity definitions ─────────────────────────────────────────────────────

const ACTIVITIES: Activity[] = [
  {
    key: 'rain',
    title: 'Rain Window',
    description: 'Watch the rain for a minute.',
    effort: '1–2 min',
    accentColor: Colors.accent,
    implemented: true,
  },
  {
    key: 'puzzle',
    title: 'Tiny Puzzle',
    description: 'A tiny thing to solve. No rush.',
    effort: '2–5 min',
    accentColor: Colors.primary,
    implemented: true,
  },
  {
    key: 'mug',
    title: "Colour Lola's Mug",
    description: 'Colour something small.',
    effort: '1–3 min',
    accentColor: Colors.flare,
    implemented: true,
  },
  {
    key: 'drift',
    title: 'Word Drift',
    description: 'Find one word that feels okay.',
    effort: '1 min',
    accentColor: Colors.primary,
    implemented: true,
  },
  {
    key: 'orb',
    title: 'Breathing Orb',
    description: "Breathe if you want to. Skip if you don't.",
    effort: 'Any time',
    accentColor: Colors.accent,
    implemented: true,
  },
  {
    key: 'sort',
    title: 'Soft Sort',
    description: 'Put a few things where they belong.',
    effort: '2–3 min',
    accentColor: Colors.primary,
    implemented: true,
  },
];

// ─── Reduce-motion helper ─────────────────────────────────────────────────────

function useReduceMotion() {
  const [reduce, setReduce] = React.useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// ─── Animated previews ────────────────────────────────────────────────────────

const PUZZLE_PREVIEW_PIECES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Raindrops slowly falling down a dark-window surface */
function RainPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const drops = [0, 1, 2, 3, 4, 5, 6, 7];
  const anims = useRef(drops.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 260),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800 + i * 120,
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion, anims]);

  return (
    <View style={preview.rain}>
      {drops.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            preview.raindrop,
            {
              left: `${8 + i * 11}%`,
              opacity: reduceMotion ? 0.3 : anims[i].interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.5, 0] }),
              transform: [
                {
                  translateY: reduceMotion
                    ? 30
                    : anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 90] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Grid pieces gently settling into place */
function PuzzlePreview({ reduceMotion }: { reduceMotion: boolean }) {
  const anims = useRef(PUZZLE_PREVIEW_PIECES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animations = PUZZLE_PREVIEW_PIECES.map((_, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300 + 400),
          Animated.timing(anims[i], { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.delay(3000),
          Animated.timing(anims[i], { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion, anims]);

  return (
    <View style={preview.puzzle}>
      {PUZZLE_PREVIEW_PIECES.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            preview.puzzlePiece,
            {
              opacity: reduceMotion ? 0.6 : anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.75] }),
              transform: [
                {
                  scale: reduceMotion
                    ? 1
                    : anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Mug outline slowly filling with muted colour */
function MugPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const hueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const fill = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnim, { toValue: 1, duration: 3500, useNativeDriver: false }),
        Animated.delay(800),
        Animated.timing(fillAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        Animated.delay(400),
      ])
    );
    const hue = Animated.loop(
      Animated.sequence([
        Animated.timing(hueAnim, { toValue: 1, duration: 7000, useNativeDriver: false }),
        Animated.timing(hueAnim, { toValue: 0, duration: 7000, useNativeDriver: false }),
      ])
    );
    fill.start();
    hue.start();
    return () => { fill.stop(); hue.stop(); };
  }, [reduceMotion, fillAnim, hueAnim]);

  const fillHeight = reduceMotion
    ? 40
    : fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const fillColor = reduceMotion
    ? Colors.flare
    : hueAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [Colors.flare, Colors.primary, Colors.accent],
      });

  return (
    <View style={preview.mug}>
      {/* Mug outline */}
      <View style={preview.mugOutline}>
        <Animated.View style={[preview.mugFill, { height: fillHeight, backgroundColor: fillColor }]} />
      </View>
      {/* Handle */}
      <View style={preview.mugHandle} />
    </View>
  );
}

/** Gentle words drifting slowly */
const DRIFT_WORDS = ['still', 'okay', 'here', 'soft', 'rest', 'safe', 'quiet', 'slow'];
function WordDriftPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const anims = useRef(DRIFT_WORDS.map((_, i) => new Animated.Value(i / DRIFT_WORDS.length))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 6000 + i * 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion, anims]);

  return (
    <View style={preview.drift}>
      {DRIFT_WORDS.map((word, i) => (
        <Animated.Text
          key={word}
          style={[
            preview.driftWord,
            {
              top: `${15 + (i % 4) * 20}%`,
              opacity: reduceMotion
                ? 0.35
                : anims[i].interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.6, 0.4, 0] }),
              transform: [
                {
                  translateX: reduceMotion
                    ? 0
                    : anims[i].interpolate({ inputRange: [0, 1], outputRange: [-10, 80] }),
                },
              ],
            },
          ]}
        >
          {word}
        </Animated.Text>
      ))}
    </View>
  );
}

/** Soft orb slowly expanding and shrinking */
function OrbPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1, duration: 3800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.7, duration: 3800, useNativeDriver: true }),
      ])
    );
    const opacity = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.7, duration: 3800, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.35, duration: 3800, useNativeDriver: true }),
      ])
    );
    scale.start();
    opacity.start();
    return () => { scale.stop(); opacity.stop(); };
  }, [reduceMotion, scaleAnim, opacityAnim]);

  return (
    <View style={preview.orb}>
      <Animated.View
        style={[
          preview.orbInner,
          {
            opacity: reduceMotion ? 0.5 : opacityAnim,
            transform: [{ scale: reduceMotion ? 0.85 : scaleAnim }],
          },
        ]}
      />
    </View>
  );
}

/** Tiny objects slowly sorting into groups */
function SortPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const items = [0, 1, 2, 3, 4, 5];
  const anims = useRef(items.map((_, i) => new Animated.Value(i % 2 === 0 ? -14 : 14))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 350),
          Animated.spring(anim, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
          Animated.delay(2500),
          Animated.timing(anim, { toValue: i % 2 === 0 ? -14 : 14, duration: 600, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion, anims]);

  const COLORS = [Colors.flare, Colors.primary, Colors.accent, Colors.primary, Colors.flare, Colors.accent];

  return (
    <View style={preview.sort}>
      <View style={preview.sortRow}>
        {items.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              preview.sortItem,
              { backgroundColor: COLORS[i] },
              { transform: [{ translateY: reduceMotion ? 0 : anims[i] }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function getPreview(key: string, reduceMotion: boolean) {
  switch (key) {
    case 'rain':  return <RainPreview reduceMotion={reduceMotion} />;
    case 'puzzle': return <PuzzlePreview reduceMotion={reduceMotion} />;
    case 'mug':   return <MugPreview reduceMotion={reduceMotion} />;
    case 'drift': return <WordDriftPreview reduceMotion={reduceMotion} />;
    case 'orb':   return <OrbPreview reduceMotion={reduceMotion} />;
    case 'sort':  return <SortPreview reduceMotion={reduceMotion} />;
    default:      return null;
  }
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  reduceMotion,
  onPress,
}: {
  activity: Activity;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const ff = useFontFamily();

  return (
    <Pressable
      style={({ pressed }) => [card.root, pressed && card.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      {/* Animated preview */}
      <View style={[card.preview, { borderColor: activity.accentColor + '28' }]}>
        {getPreview(activity.key, reduceMotion)}
      </View>

      {/* Text content */}
      <View style={card.body}>
        <View style={card.titleRow}>
          <Text style={[card.title, { fontFamily: ff.semibold }]}>{activity.title}</Text>
          <View style={[card.effortBadge, { borderColor: activity.accentColor + '40' }]}>
            <Text style={[card.effortText, { fontFamily: ff.regular, color: activity.accentColor }]}>
              {activity.effort}
            </Text>
          </View>
        </View>
        <Text style={[card.description, { fontFamily: ff.regular }]}>{activity.description}</Text>

        <View style={card.footer}>
          <Text style={[card.cta, { fontFamily: ff.medium, color: activity.accentColor }]}>
            {activity.implemented ? 'Try this' : 'Coming soon'}
          </Text>
          {activity.implemented ? (
            <MaterialIcons name="chevron-right" size={16} color={activity.accentColor} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Placeholder detail ───────────────────────────────────────────────────────

function PlaceholderDetail({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const ff = useFontFamily();
  return (
    <View style={detail.root}>
      <Text style={[detail.title, { fontFamily: ff.bold }]}>{activity.title}</Text>
      <Text style={[detail.body, { fontFamily: ff.regular }]}>
        This activity is coming soon.{'\n\n'}
        Sit with the idea for now.
      </Text>
      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Back</Text>
      </Pressable>
    </View>
  );
}

// ─── Puzzle detail ────────────────────────────────────────────────────────────

const PUZZLE_SIZE = 9;
const PUZZLE_TILE_COLORS = [
  Colors.primary, Colors.accent, Colors.flare,
  Colors.accent, Colors.primary, Colors.primary,
  Colors.flare,  Colors.accent,  Colors.primary,
];

function PuzzleDetail({ onBack }: { onBack: () => void }) {
  const ff = useFontFamily();
  const [revealed, setRevealed] = React.useState<boolean[]>(Array(PUZZLE_SIZE).fill(false));
  const anims = useRef(
    Array.from({ length: PUZZLE_SIZE }, () => new Animated.Value(0))
  ).current;
  const done = revealed.every(Boolean);

  function revealTile(i: number) {
    if (revealed[i]) return;
    setRevealed(prev => { const next = [...prev]; next[i] = true; return next; });
    Animated.spring(anims[i], {
      toValue: 1, friction: 6, tension: 80, useNativeDriver: true,
    }).start();
  }

  return (
    <View style={detail.root}>
      <Text style={[detail.title, { fontFamily: ff.bold }]}>Tiny Puzzle</Text>
      <Text style={[detail.body, { fontFamily: ff.regular }]}>
        {done ? "You did it. That's all it was." : 'Tap each tile to wake it up.'}
      </Text>
      <View style={puzzleDetail.grid}>
        {Array.from({ length: PUZZLE_SIZE }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => revealTile(i)}
            style={[
              puzzleDetail.tile,
              revealed[i] && { borderColor: PUZZLE_TILE_COLORS[i] + '60' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Tile ${i + 1}`}
          >
            <Animated.View
              style={[
                puzzleDetail.tileFill,
                {
                  backgroundColor: PUZZLE_TILE_COLORS[i],
                  opacity: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
                  transform: [
                    { scale: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                  ],
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Mug detail ───────────────────────────────────────────────────────────────

const MUG_PALETTE = ['#A06B63', '#78836F', '#6F8295', '#9B8B78', '#7A7A9E', '#5C8C7A'];
const MUG_SECTION_KEYS = ['body', 'rim', 'handle', 'mark'] as const;
type MugSectionKey = typeof MUG_SECTION_KEYS[number];
const MUG_SECTION_LABELS: Record<MugSectionKey, string> = {
  body: 'Body', rim: 'Rim', handle: 'Handle', mark: 'Mark',
};
const MUG_UNSET = Colors.surface;

function MugDetail({ onBack }: { onBack: () => void }) {
  const ff = useFontFamily();
  const [pickedColor, setPickedColor] = React.useState(MUG_PALETTE[0]);
  const [mugColors, setMugColors] = React.useState<Record<MugSectionKey, string>>({
    body: MUG_UNSET, rim: MUG_UNSET, handle: MUG_UNSET, mark: MUG_UNSET,
  });
  const allColored = Object.values(mugColors).every(c => c !== MUG_UNSET);

  function paintSection(key: MugSectionKey) {
    setMugColors(prev => ({ ...prev, [key]: pickedColor }));
  }

  return (
    <View style={detail.root}>
      <Text style={[detail.title, { fontFamily: ff.bold }]}>Colour Lola&apos;s Mug</Text>
      <Text style={[detail.body, { fontFamily: ff.regular }]}>
        {allColored ? "Lola loves it." : "Pick a colour, then tap a part."}
      </Text>

      {/* Mug visual */}
      <View style={mugDetail.mugWrap}>
        <View style={[mugDetail.mugRim, { backgroundColor: mugColors.rim }]} />
        <View style={mugDetail.mugBodyRow}>
          <View style={[mugDetail.mugBody, { backgroundColor: mugColors.body }]}>
            <View
              style={[
                mugDetail.mugMark,
                { backgroundColor: mugColors.mark === MUG_UNSET ? Colors.border : mugColors.mark },
              ]}
            />
          </View>
          <View
            style={[
              mugDetail.mugHandle,
              { borderColor: mugColors.handle === MUG_UNSET ? Colors.textSubtle : mugColors.handle },
            ]}
          />
        </View>
      </View>

      {/* Colour palette */}
      <View style={mugDetail.palette}>
        {MUG_PALETTE.map(c => (
          <Pressable
            key={c}
            style={[
              mugDetail.swatch,
              { backgroundColor: c },
              pickedColor === c && mugDetail.swatchActive,
            ]}
            onPress={() => setPickedColor(c)}
            accessibilityRole="button"
            accessibilityLabel={`colour ${c}`}
          />
        ))}
      </View>

      {/* Section buttons */}
      <View style={mugDetail.sections}>
        {MUG_SECTION_KEYS.map(key => (
          <Pressable
            key={key}
            style={[
              mugDetail.sectionBtn,
              { borderColor: mugColors[key] === MUG_UNSET ? Colors.border : mugColors[key] },
            ]}
            onPress={() => paintSection(key)}
            accessibilityRole="button"
            accessibilityLabel={`Paint ${MUG_SECTION_LABELS[key]}`}
          >
            <View
              style={[
                mugDetail.sectionDot,
                {
                  backgroundColor:
                    mugColors[key] === MUG_UNSET ? Colors.textSubtle + '40' : mugColors[key],
                },
              ]}
            />
            <Text style={[mugDetail.sectionLabel, { fontFamily: ff.regular }]}>
              {MUG_SECTION_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Word Drift detail ────────────────────────────────────────────────────────

const DRIFT_WORDS_FULL = [
  'still', 'okay', 'here', 'soft', 'rest',
  'safe', 'quiet', 'slow', 'enough', 'gentle', 'warm', 'easy',
];

function WordDriftDetail({
  onBack,
  reduceMotion,
}: {
  onBack: () => void;
  reduceMotion: boolean;
}) {
  const ff = useFontFamily();
  const [chosen, setChosen] = React.useState<string | null>(null);
  const fadeAnims = useRef(DRIFT_WORDS_FULL.map(() => new Animated.Value(1))).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnims = useRef(DRIFT_WORDS_FULL.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion || chosen) return;
    const animations = floatAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 250),
          Animated.timing(anim, { toValue: 1, duration: 2500 + i * 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2500 + i * 200, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [reduceMotion, chosen, floatAnims]);

  function chooseWord(word: string, idx: number) {
    if (chosen) return;
    setChosen(word);
    const fades: Animated.CompositeAnimation[] = [];
    fadeAnims.forEach((anim, i) => {
      if (i !== idx) {
        fades.push(
          Animated.timing(anim, { toValue: 0.12, duration: 700, useNativeDriver: true })
        );
      }
    });
    Animated.parallel(fades).start();
    Animated.spring(scaleAnim, {
      toValue: 1.3, friction: 5, tension: 60, useNativeDriver: true,
    }).start();
  }

  return (
    <View style={detail.root}>
      <Text style={[detail.title, { fontFamily: ff.bold }]}>Word Drift</Text>
      <Text style={[detail.body, { fontFamily: ff.regular }]}>
        {chosen ? `"${chosen}" — that's yours for now.` : 'Tap the word that feels okay.'}
      </Text>
      <View style={driftDetail.wordGrid}>
        {DRIFT_WORDS_FULL.map((word, i) => (
          <Animated.View
            key={word}
            style={{
              opacity: fadeAnims[i],
              transform: [
                { scale: chosen === word ? scaleAnim : 1 },
                {
                  translateY: reduceMotion
                    ? 0
                    : floatAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }),
                },
              ],
            }}
          >
            <Pressable
              style={[driftDetail.wordChip, chosen === word && driftDetail.wordChipChosen]}
              onPress={() => chooseWord(word, i)}
              accessibilityRole="button"
              accessibilityLabel={word}
            >
              <Text
                style={[
                  driftDetail.wordText,
                  { fontFamily: ff.regular },
                  chosen === word && driftDetail.wordTextChosen,
                ]}
              >
                {word}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Soft Sort detail ─────────────────────────────────────────────────────────

type SortItemData = { id: number; label: string; color: string; placed: 'a' | 'b' | null };

const SORT_ITEMS_SEED: Omit<SortItemData, 'placed'>[] = [
  { id: 0, label: 'terracotta', color: Colors.flare    },
  { id: 1, label: 'peach',      color: '#C4897E'       },
  { id: 2, label: 'sand',       color: '#BFA98A'       },
  { id: 3, label: 'slate',      color: Colors.accent   },
  { id: 4, label: 'sage',       color: Colors.primary  },
  { id: 5, label: 'teal',       color: '#5C8C7A'       },
];

function SoftSortDetail({ onBack }: { onBack: () => void }) {
  const ff = useFontFamily();
  const [items, setItems] = React.useState<SortItemData[]>(
    SORT_ITEMS_SEED.map(item => ({ ...item, placed: null }))
  );
  const [selected, setSelected] = React.useState<number | null>(null);
  const allPlaced = items.every(it => it.placed !== null);

  function toggleSelect(id: number) {
    if (allPlaced) return;
    setSelected(prev => (prev === id ? null : id));
  }

  function placeInGroup(group: 'a' | 'b') {
    if (selected === null) return;
    setItems(prev =>
      prev.map(it => (it.id === selected ? { ...it, placed: group } : it))
    );
    setSelected(null);
  }

  const tray   = items.filter(it => it.placed === null);
  const groupA = items.filter(it => it.placed === 'a');
  const groupB = items.filter(it => it.placed === 'b');

  return (
    <View style={[detail.root, { justifyContent: 'flex-start', gap: Spacing.lg }]}>
      <Text style={[detail.title, { fontFamily: ff.bold }]}>Soft Sort</Text>
      <Text style={[detail.body, { fontFamily: ff.regular }]}>
        {allPlaced
          ? 'Everything has a place.'
          : selected !== null
          ? 'Now tap a group to place it.'
          : 'Tap an item, then choose a group.'}
      </Text>

      {/* Unsorted tray */}
      <View style={sortDetail.tray}>
        {tray.map(it => (
          <Pressable
            key={it.id}
            style={[
              sortDetail.chip,
              { borderColor: it.color + '80' },
              selected === it.id && { backgroundColor: it.color + '25', borderColor: it.color },
            ]}
            onPress={() => toggleSelect(it.id)}
            accessibilityRole="button"
            accessibilityLabel={it.label}
          >
            <View style={[sortDetail.chipDot, { backgroundColor: it.color }]} />
            <Text style={[sortDetail.chipText, { fontFamily: ff.regular }]}>{it.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Drop zones */}
      <View style={sortDetail.zones}>
        <Pressable
          style={[sortDetail.zone, selected !== null && sortDetail.zoneActive]}
          onPress={() => placeInGroup('a')}
          accessibilityRole="button"
          accessibilityLabel="Group one"
        >
          <Text style={[sortDetail.zoneLabel, { fontFamily: ff.medium }]}>here</Text>
          <View style={sortDetail.zoneItems}>
            {groupA.map(it => (
              <View key={it.id} style={[sortDetail.zoneDot, { backgroundColor: it.color }]} />
            ))}
          </View>
        </Pressable>
        <Pressable
          style={[sortDetail.zone, selected !== null && sortDetail.zoneActive]}
          onPress={() => placeInGroup('b')}
          accessibilityRole="button"
          accessibilityLabel="Group two"
        >
          <Text style={[sortDetail.zoneLabel, { fontFamily: ff.medium }]}>there</Text>
          <View style={sortDetail.zoneItems}>
            {groupB.map(it => (
              <View key={it.id} style={[sortDetail.zoneDot, { backgroundColor: it.color }]} />
            ))}
          </View>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Rain detail ──────────────────────────────────────────────────────────────

function RainDetail({ onBack, reduceMotion }: { onBack: () => void; reduceMotion: boolean }) {
  const ff = useFontFamily();
  // Full-screen rain — reuse RainPreview scaled up
  const drops = Array.from({ length: 18 }, (_, i) => i);
  const anims = useRef(drops.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: 1, duration: 2200 + i * 80, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion, anims]);

  return (
    <View style={detail.root}>
      <View style={detail.rainWindow}>
        {drops.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              detail.raindrop,
              {
                left: `${3 + i * 5.2}%`,
                opacity: reduceMotion ? 0.3 : anims[i].interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.6, 0.4, 0] }),
                transform: [
                  {
                    translateY: reduceMotion
                      ? 80
                      : anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      <View style={detail.overlay}>
        <Text style={[detail.rainLabel, { fontFamily: ff.regular }]}>
          Watch the rain for a minute.
        </Text>
        <Pressable
          style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Orb detail ───────────────────────────────────────────────────────────────

function OrbDetail({ onBack, reduceMotion }: { onBack: () => void; reduceMotion: boolean }) {
  const ff = useFontFamily();
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.6, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(labelAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(labelAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [reduceMotion, scaleAnim, labelAnim]);

  const inhaleOpacity = reduceMotion ? 0.6 : labelAnim;
  const exhaleOpacity = reduceMotion ? 0.6 : labelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={detail.root}>
      <View style={detail.orbFull}>
        <Animated.View
          style={[
            detail.orbCircle,
            { transform: [{ scale: reduceMotion ? 0.85 : scaleAnim }] },
          ]}
        />
        <View style={detail.orbLabels} pointerEvents="none">
          <Animated.Text style={[detail.orbLabel, { fontFamily: ff.regular, opacity: inhaleOpacity }]}>
            breathe in
          </Animated.Text>
          <Animated.Text style={[detail.orbLabel, { fontFamily: ff.regular, opacity: exhaleOpacity }]}>
            breathe out
          </Animated.Text>
        </View>
      </View>
      <Text style={[detail.rainLabel, { fontFamily: ff.regular }]}>
        No pressure. Skip if you need to.
      </Text>
      <Pressable
        style={({ pressed }) => [detail.backBtn, pressed && { opacity: 0.7 }]}
        onPress={onBack}
        accessibilityRole="button"
      >
        <Text style={[detail.backText, { fontFamily: ff.medium }]}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function QuietTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const reduceMotion = useReduceMotion();
  const [activeActivity, setActiveActivity] = React.useState<Activity | null>(null);

  function handleCardPress(activity: Activity) {
    if (!activity.implemented) {
      setActiveActivity(activity);
      return;
    }
    setActiveActivity(activity);
  }

  if (activeActivity) {
    if (activeActivity.key === 'rain') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <RainDetail onBack={() => setActiveActivity(null)} reduceMotion={reduceMotion} />
        </View>
      );
    }
    if (activeActivity.key === 'orb') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <OrbDetail onBack={() => setActiveActivity(null)} reduceMotion={reduceMotion} />
        </View>
      );
    }
    if (activeActivity.key === 'puzzle') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <PuzzleDetail onBack={() => setActiveActivity(null)} />
        </View>
      );
    }
    if (activeActivity.key === 'mug') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <MugDetail onBack={() => setActiveActivity(null)} />
        </View>
      );
    }
    if (activeActivity.key === 'drift') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <WordDriftDetail onBack={() => setActiveActivity(null)} reduceMotion={reduceMotion} />
        </View>
      );
    }
    if (activeActivity.key === 'sort') {
      return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <SoftSortDetail onBack={() => setActiveActivity(null)} />
        </View>
      );
    }
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <PlaceholderDetail activity={activeActivity} onBack={() => setActiveActivity(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.headingBlock}>
          <Text style={[styles.pageTitle, { fontFamily: ff.bold }]}>Quiet Time</Text>
          <Text style={[styles.pageSubtitle, { fontFamily: ff.regular }]}>
            Something gentle for when your brain has nowhere to go.
          </Text>
        </View>

        {/* Lola — calm, low-energy presence */}
        <View style={styles.lolaBlock}>
          <Image
            source={Companion.QuietTime}
            style={styles.lolaImage}
            resizeMode="contain"
            accessibilityLabel="Lola sitting quietly"
          />
          <Text style={[styles.lolaCaption, { fontFamily: ff.regular }]}>
            No score. No pressure. Just something small.
          </Text>
        </View>

        {/* Activity cards */}
        <View style={styles.cardList}>
          {ACTIVITIES.map((activity) => (
            <ActivityCard
              key={activity.key}
              activity={activity}
              reduceMotion={reduceMotion}
              onPress={() => handleCardPress(activity)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headingBlock: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  pageTitle: {
    fontSize: FontSizes.xxl,
    color: Colors.text,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  pageSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 26,
    maxWidth: 320,
  },
  lolaBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  lolaImage: {
    width: 88,
    height: 108,
    opacity: 0.88,
  },
  lolaCaption: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardList: {
    gap: Spacing.md,
  },
});

// ─── Card styles ──────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  root: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.82,
  },
  preview: {
    height: 110,
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    overflow: 'hidden',
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.md,
    color: Colors.text,
    letterSpacing: -0.3,
    flex: 1,
  },
  effortBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  effortText: {
    fontSize: FontSizes.xs,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 2,
  },
  cta: {
    fontSize: FontSizes.sm,
  },
});

// ─── Preview styles ───────────────────────────────────────────────────────────

const preview = StyleSheet.create({
  // Rain
  rain: {
    flex: 1,
    position: 'relative',
  },
  raindrop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: Colors.accent + 'AA',
  },

  // Puzzle
  puzzle: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 6,
  },
  puzzlePiece: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Mug
  mug: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  mugOutline: {
    width: 44,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.textSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  mugFill: {
    width: '100%',
    borderRadius: 2,
  },
  mugHandle: {
    width: 12,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.textSubtle,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginLeft: -1,
  },

  // Word drift
  drift: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  driftWord: {
    position: 'absolute',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },

  // Orb
  orb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
  },

  // Sort
  sort: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sortItem: {
    width: 16,
    height: 16,
    borderRadius: 4,
    opacity: 0.7,
  },
});

// ─── Detail styles ────────────────────────────────────────────────────────────

const detail = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 28,
  },
  backBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },

  // Rain detail
  rainWindow: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  raindrop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: Colors.accent + 'BB',
  },
  overlay: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  rainLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 22,
  },

  // Orb detail
  orbFull: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.accent,
    opacity: 0.55,
  },
  orbLabels: {
    position: 'absolute',
    alignItems: 'center',
    gap: 6,
  },
  orbLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    letterSpacing: 1,
  },
});

// ─── New activity detail styles ───────────────────────────────────────────────

const puzzleDetail = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: 220,
    justifyContent: 'center',
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFill: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md - 2,
  },
});

const mugDetail = StyleSheet.create({
  mugWrap: {
    alignItems: 'flex-start',
  },
  mugRim: {
    width: 80,
    height: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.textSubtle,
    backgroundColor: Colors.surface,
  },
  mugBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mugBody: {
    width: 80,
    height: 100,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: Colors.textSubtle,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  mugMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  mugHandle: {
    width: 20,
    height: 50,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 2,
    borderLeftWidth: 0,
    borderColor: Colors.textSubtle,
    marginLeft: -2,
  },
  palette: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: Colors.text,
  },
  sections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  sectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});

const driftDetail = StyleSheet.create({
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    maxWidth: 320,
  },
  wordChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wordChipChosen: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primary,
  },
  wordText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  wordTextChosen: {
    color: Colors.primary,
  },
});

const sortDetail = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  zones: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  zone: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 80,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  zoneActive: {
    borderColor: Colors.primaryLight,
  },
  zoneLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    letterSpacing: 0.6,
  },
  zoneItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
