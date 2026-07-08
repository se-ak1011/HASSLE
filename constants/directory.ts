export type DirectoryVerificationStatus = 'public-info-seed' | 'unverified-public-listing';

export type SpecialistDirectoryEntry = {
  id: string;
  name: string;
  clinicName: string;
  profession: string;
  specialties: string[];
  conditions: string[];
  country: 'US';
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
