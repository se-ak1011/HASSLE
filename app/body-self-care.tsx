import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';

export default function BodySelfCareScreen() {
  return (
    <BodyCategoryScreen
      category="self-care"
      title="Self-care"
      subtitle="Gentle things count. Nothing also counts."
      primaryChips={['Heat pack', 'Stretch', 'Warm shower', 'Water', 'Tea', 'Nap', 'Fresh air', 'Rest', 'Nothing today']}
      textPlaceholder="Tell Lola what helped, or what felt impossible."
    />
  );
}
