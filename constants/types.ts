// Hassle — Core Type Definitions

export type EnergyMode = 'spoon' | 'battery';

export type TaskStatus = 'pending' | 'completed' | 'moved';

/** Built-in tags + any custom tags the user creates (arbitrary strings). */
export type DailyTag = string;

export type CompletionFeeling = 'easier' | 'right' | 'harder';

export type ReminderFrequency = 'off' | 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  name: string;
  category?: string;
  baseCost: number;
  effectiveCost: number;      // baseCost × flare multiplier
  completedCost?: number;     // cost at time of completion
  status: TaskStatus;
  isPreMade?: boolean;
  isDefaultTask?: boolean;    // generated from user's default daily tasks
  completedAt?: string;
  completionFeeling?: CompletionFeeling;
}

export interface DayState {
  date: string;               // ISO date string YYYY-MM-DD
  energyMode: EnergyMode;
  energyLevel: number;        // spoons: 1–12, battery: 10–100
  isFlareDay: boolean;
  tags: DailyTag[];
  tasks: Task[];
  journalEntry?: string;
  guidedPrompts?: {
    drained?: string;
    helped?: string;
    notDone?: string;
    symptoms?: string;
  };
  checkedIn: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
}

export interface UserPreferences {
  energyMode: EnergyMode;
  taskDefaults: Record<string, number>; // taskName → baseCost
  customTags: string[];                 // user-created reusable tags
  defaultDailyTasks: DefaultDailyTask[]; // tasks auto-added at day start
  reminders: ReminderSettings;
  hasCompletedOnboarding: boolean;
}

/** A task that auto-populates every day */
export interface DefaultDailyTask {
  name: string;
  baseCost: number;
  category: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  energyMode: 'spoon',
  taskDefaults: {},
  customTags: [],
  defaultDailyTasks: [],
  reminders: {
    enabled: false,
    frequency: 'low',
  },
  hasCompletedOnboarding: false,
};

/** Built-in predefined tags — always shown first */
export const BUILT_IN_TAGS: string[] = [
  'pain',
  'fatigue',
  'brain fog',
  'overstimulated',
  'anxious',
  'rested',
  'nauseous',
  'low mood',
  'decent day',
];

export const PREMADE_TASKS: { name: string; baseCost: number; category: string }[] = [
  { name: 'Shower', baseCost: 3, category: 'Self-care' },
  { name: 'Bath', baseCost: 2, category: 'Self-care' },
  { name: 'Get dressed', baseCost: 2, category: 'Self-care' },
  { name: 'Cook a meal', baseCost: 4, category: 'Nourishment' },
  { name: 'Make a snack', baseCost: 1, category: 'Nourishment' },
  { name: 'Wash dishes', baseCost: 3, category: 'Home' },
  { name: 'Fold laundry', baseCost: 2, category: 'Home' },
  { name: 'School run', baseCost: 4, category: 'Responsibilities' },
  { name: 'Answer emails', baseCost: 3, category: 'Work' },
  { name: 'Phone call', baseCost: 3, category: 'Social' },
  { name: 'Go outside', baseCost: 3, category: 'Movement' },
  { name: 'Short walk', baseCost: 2, category: 'Movement' },
];

/** Onboarding task options shown during first-launch setup */
export const ONBOARDING_TASK_OPTIONS: DefaultDailyTask[] = [
  { name: 'Get out of bed', baseCost: 1, category: 'Morning' },
  { name: 'Get dressed', baseCost: 2, category: 'Self-care' },
  { name: 'Eat breakfast', baseCost: 1, category: 'Nourishment' },
  { name: 'Eat lunch', baseCost: 1, category: 'Nourishment' },
  { name: 'Eat dinner', baseCost: 1, category: 'Nourishment' },
  { name: 'Take medication', baseCost: 1, category: 'Self-care' },
  { name: 'Shower', baseCost: 3, category: 'Self-care' },
  { name: 'Leave the house', baseCost: 3, category: 'Movement' },
];

/** Reminder frequency descriptions */
export const REMINDER_FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  off: 'Off',
  low: 'Low — once a day',
  medium: 'Medium — twice a day',
  high: 'High — three times a day',
};
