import { ImageSourcePropType } from 'react-native';
import { Companion } from './companion';
import type { BodyLolaCategory } from '@/services/aiLola';

// Single source of truth for the five Body categories. Used both by the Body
// carousel (inline logging, no navigation) and by the standalone /body-* routes,
// so the chips and copy stay identical everywhere.
export type BodyCategoryConfig = {
  id: BodyLolaCategory;
  label: string;
  title: string;
  subtitle: string;
  primaryChips: string[];
  secondaryTitle?: string;
  secondaryChips?: string[];
  textPlaceholder?: string;
  companion: ImageSourcePropType;
};

export const BODY_CATEGORIES: BodyCategoryConfig[] = [
  {
    id: 'pain',
    label: 'Pain',
    title: 'Pain',
    subtitle: 'What hurts? No numbers. Just noticing.',
    primaryChips: ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Arms', 'Hands', 'Hips', 'Legs', 'Feet', 'Other'],
    secondaryTitle: 'What does it feel like?',
    secondaryChips: ['Burning', 'Sharp', 'Aching', 'Stiff', 'Throbbing', 'Electric', 'Comes & goes', 'Other'],
    textPlaceholder: 'Want to tell Lola more?',
    companion: Companion.BodyPain,
  },
  {
    id: 'fatigue',
    label: 'Fatigue',
    title: 'Fatigue',
    subtitle: 'How does your energy feel in real words?',
    primaryChips: ['Running on fumes', 'Heavy', 'Tired', 'Managing', 'Actually okay today', 'Great day'],
    textPlaceholder: 'Anything you want Lola to know?',
    companion: Companion.BodyFatigue,
  },
  {
    id: 'symptoms',
    label: 'Symptoms',
    title: 'Symptoms',
    subtitle: 'Small notes. Only what stands out.',
    primaryChips: ['Brain fog', 'Nausea', 'Dizziness', 'Migraine', 'Sensory overload', 'Heart racing', 'GI', 'Temperature', 'Sleep', 'Other'],
    textPlaceholder: 'Tell Lola what is happening, if you want.',
    companion: Companion.BodySymptoms,
  },
  {
    id: 'medication',
    label: 'Medication',
    title: 'Medication',
    subtitle: 'A simple note. No judgment.',
    primaryChips: ['Taken', 'Need reminder', 'Skipped', 'New medication', 'Side effects'],
    textPlaceholder: 'Optional notes for Lola.',
    companion: Companion.BodyMedication,
  },
  {
    id: 'self-care',
    label: 'Self-care',
    title: 'Self-care',
    subtitle: 'Gentle things count. Nothing also counts.',
    primaryChips: ['Heat pack', 'Stretch', 'Warm shower', 'Water', 'Tea', 'Nap', 'Fresh air', 'Rest', 'Nothing today'],
    textPlaceholder: 'Tell Lola what helped, or what felt impossible.',
    companion: Companion.BodySelfCare,
  },
];
