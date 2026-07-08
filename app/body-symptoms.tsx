import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';

export default function BodySymptomsScreen() {
  return (
    <BodyCategoryScreen
      category="symptoms"
      title="Symptoms"
      subtitle="Small notes. Only what stands out."
      primaryChips={['Brain fog', 'Nausea', 'Dizziness', 'Migraine', 'Sensory overload', 'Heart racing', 'GI', 'Temperature', 'Sleep', 'Other']}
      textPlaceholder="Tell Lola what is happening, if you want."
    />
  );
}
