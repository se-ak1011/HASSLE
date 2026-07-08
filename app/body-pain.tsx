import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';
import { Companion } from '@/constants/companion';

export default function BodyPainScreen() {
  return (
    <BodyCategoryScreen
      category="pain"
      title="Pain"
      subtitle="What hurts? No numbers. Just noticing."
      primaryChips={['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Arms', 'Hands', 'Hips', 'Legs', 'Feet', 'Other']}
      secondaryTitle="What does it feel like?"
      secondaryChips={['Burning', 'Sharp', 'Aching', 'Stiff', 'Throbbing', 'Electric', 'Comes & goes', 'Other']}
      companion={Companion.BodyPain}
      textPlaceholder="Want to tell Lola more?"
    />
  );
}
