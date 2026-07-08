import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';

export default function BodyMedicationScreen() {
  return (
    <BodyCategoryScreen
      category="medication"
      title="Medication"
      subtitle="A simple note. No judgment."
      primaryChips={['Taken', 'Need reminder', 'Skipped', 'New medication', 'Side effects']}
      textPlaceholder="Optional notes for Lola."
    />
  );
}
