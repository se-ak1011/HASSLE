import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';
import { Companion } from '@/constants/companion';

export default function BodyMedicationScreen() {
  return (
    <BodyCategoryScreen
      category="medication"
      title="Medication"
      subtitle="A simple note. No judgment."
      primaryChips={['Taken', 'Need reminder', 'Skipped', 'New medication', 'Side effects']}
      companion={Companion.BodyMedication}
      textPlaceholder="Optional notes for Lola."
    />
  );
}
