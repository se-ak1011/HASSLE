import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';

export default function BodyPainScreen() {
  return (
    <BodyCategoryScreen
      category="pain"
      title="Pain"
      subtitle="What hurts? No numbers. Just noticing."
      primaryChips={['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Arms', 'Hands', 'Hips', 'Legs', 'Feet', 'Other']}
      secondaryTitle="What does it feel like?"
      secondaryChips={['Burning', 'Sharp', 'Aching', 'Stiff', 'Throbbing', 'Electric', 'Comes & goes', 'Other']}
      textPlaceholder="Want to tell Lola more?"
    />
  );
}
