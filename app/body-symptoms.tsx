import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';
import { Companion } from '@/constants/companion';

export default function BodySymptomsScreen() {
  return (
    <BodyCategoryScreen
      category="symptoms"
      title="Symptoms"
      subtitle="Small notes. Only what stands out."
      primaryChips={['Brain fog', 'Nausea', 'Dizziness', 'Migraine', 'Sensory overload', 'Heart racing', 'GI', 'Temperature', 'Sleep', 'Other']}
      companion={Companion.BodySymptoms}
      textPlaceholder="Tell Lola what is happening, if you want."
    />
  );
}
