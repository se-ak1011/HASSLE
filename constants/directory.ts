import type { Region } from '@/localization/region';

export type DirectoryVerificationStatus = 'public-info-seed' | 'unverified-public-listing';

export type SpecialistDirectoryEntry = {
  id: string;
  name: string;
  clinicName: string;
  profession: string;
  specialties: string[];
  conditions: string[];
  country: Region;
  regionState: string;
  city: string;
  website: string;
  sourceUrl: string;
  verificationStatus: DirectoryVerificationStatus;
  notes: string;
  accessibilityNotes: string;
  telehealth: boolean;
  tags: string[];
};

export const SPECIALIST_DIRECTORY_SEED: SpecialistDirectoryEntry[] = [
  {
    id: 'us-ut-bateman-horne-center',
    name: 'Bateman Horne Center clinical team',
    clinicName: 'Bateman Horne Center',
    profession: 'Multidisciplinary clinic / research center',
    specialties: ['ME/CFS', 'Long COVID', 'fibromyalgia', 'research-informed care'],
    conditions: ['ME/CFS', 'Long COVID', 'fibromyalgia'],
    country: 'US',
    regionState: 'UT',
    city: 'Salt Lake City',
    website: 'https://batemanhornecenter.org/',
    sourceUrl: 'https://batemanhornecenter.org/',
    verificationStatus: 'public-info-seed',
    notes: 'Seeded from public clinic information for later review; check current services before booking.',
    accessibilityNotes: 'Review clinic accessibility and appointment format directly with the center.',
    telehealth: false,
    tags: ['ME/CFS', 'Long COVID', 'fibromyalgia', 'clinic'],
  },
  {
    id: 'us-ca-stanford-autonomic-disorders-program',
    name: 'Stanford Autonomic Disorders Program',
    clinicName: 'Stanford Health Care',
    profession: 'Neurology / autonomic disorders clinic',
    specialties: ['POTS / dysautonomia', 'neurology', 'autonomic testing'],
    conditions: ['POTS / dysautonomia'],
    country: 'US',
    regionState: 'CA',
    city: 'Palo Alto',
    website: 'https://stanfordhealthcare.org/',
    sourceUrl: 'https://stanfordhealthcare.org/medical-clinics/autonomic-disorders-program.html',
    verificationStatus: 'unverified-public-listing',
    notes: 'Public listing seed for review; not an endorsement or recommendation.',
    accessibilityNotes: 'Ask the clinic about testing demands, travel, and accommodations.',
    telehealth: false,
    tags: ['POTS', 'dysautonomia', 'neurology'],
  },
  {
    id: 'us-md-hopkins-pain-treatment-program',
    name: 'Johns Hopkins Pain Treatment Program',
    clinicName: 'Johns Hopkins Medicine',
    profession: 'Pain medicine / multidisciplinary pain program',
    specialties: ['chronic pain', 'pain psychology', 'PM&R'],
    conditions: ['chronic pain', 'fibromyalgia'],
    country: 'US',
    regionState: 'MD',
    city: 'Baltimore',
    website: 'https://www.hopkinsmedicine.org/',
    sourceUrl: 'https://www.hopkinsmedicine.org/pain-treatment',
    verificationStatus: 'unverified-public-listing',
    notes: 'Seeded from public program information; check current referral requirements.',
    accessibilityNotes: 'Confirm visit format, pacing, and accessibility needs before booking.',
    telehealth: false,
    tags: ['chronic pain', 'pain psychology', 'PM&R'],
  },

  // ── United Kingdom (GB) ──────────────────────────────────────────────────
  // Public-info seeds for UK users. Well-known NHS specialist services, seeded
  // from public information for later review — NOT verified or endorsed. A GP
  // referral is usually required. Verify current services before relying on these.
  {
    id: 'gb-lon-royal-free-me-cfs-service',
    name: 'Royal Free ME/CFS Service',
    clinicName: 'Royal Free London NHS Foundation Trust',
    profession: 'NHS specialist ME/CFS service',
    specialties: ['ME/CFS', 'fatigue management', 'activity pacing'],
    conditions: ['ME/CFS', 'Long COVID', 'fibromyalgia'],
    country: 'GB',
    regionState: 'England',
    city: 'London',
    website: 'https://www.royalfree.nhs.uk/',
    sourceUrl: 'https://www.royalfree.nhs.uk/',
    verificationStatus: 'public-info-seed',
    notes: 'Seeded from public NHS information for later review. Usually needs a GP referral — check current services and referral routes before relying on this.',
    accessibilityNotes: 'Ask the service about appointment format (in person / remote) and pacing support.',
    telehealth: false,
    tags: ['ME/CFS', 'Long COVID', 'NHS', 'fatigue'],
  },
  {
    id: 'gb-lon-uclh-autonomic-unit',
    name: 'Autonomic Unit, Queen Square',
    clinicName: 'National Hospital for Neurology & Neurosurgery (UCLH)',
    profession: 'Neurology / autonomic disorders unit',
    specialties: ['POTS / dysautonomia', 'neurology', 'autonomic testing'],
    conditions: ['POTS / dysautonomia'],
    country: 'GB',
    regionState: 'England',
    city: 'London',
    website: 'https://www.uclh.nhs.uk/',
    sourceUrl: 'https://www.uclh.nhs.uk/',
    verificationStatus: 'unverified-public-listing',
    notes: 'Public listing seed for review; not an endorsement. Typically a tertiary referral service — confirm referral requirements with your GP or specialist.',
    accessibilityNotes: 'Ask about testing demands, travel, and accommodations.',
    telehealth: false,
    tags: ['POTS', 'dysautonomia', 'neurology', 'NHS'],
  },
  {
    id: 'gb-lon-guys-st-thomas-input-pain',
    name: 'INPUT Pain Management Centre',
    clinicName: "Guy's and St Thomas' NHS Foundation Trust",
    profession: 'Multidisciplinary pain management programme',
    specialties: ['chronic pain', 'pain psychology', 'rehabilitation medicine'],
    conditions: ['chronic pain', 'fibromyalgia'],
    country: 'GB',
    regionState: 'England',
    city: 'London',
    website: 'https://www.guysandstthomas.nhs.uk/',
    sourceUrl: 'https://www.guysandstthomas.nhs.uk/',
    verificationStatus: 'unverified-public-listing',
    notes: 'Seeded from public NHS information; check current referral requirements before booking.',
    accessibilityNotes: 'Confirm visit format, pacing, and accessibility needs before attending.',
    telehealth: false,
    tags: ['chronic pain', 'pain psychology', 'NHS'],
  },
];

export const DIRECTORY_CONDITION_FILTERS = [
  'ME/CFS',
  'Long COVID',
  'POTS / dysautonomia',
  'Ehlers-Danlos Syndrome / hypermobility',
  'chronic pain',
  'fibromyalgia',
  'migraine',
];

export const DIRECTORY_SPECIALTY_FILTERS = [
  'pain psychology',
  'PM&R',
  'rheumatology',
  'neurology',
  'occupational therapy',
  'physical therapy',
];
