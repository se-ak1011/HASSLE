import React from 'react';
import { BodyCategoryScreen } from '@/components/ui/BodyCategoryScreen';
import { Companion } from '@/constants/companion';

export default function BodyFatigueScreen() {
  return (
    <BodyCategoryScreen
      category="fatigue"
      title="Fatigue"
      subtitle="How does your energy feel in real words?"
      primaryChips={['Running on fumes', 'Heavy', 'Tired', 'Managing', 'Actually okay today', 'Great day']}
      companion={Companion.BodyFatigue}
      textPlaceholder="Anything you want Lola to know?"
    />
  );
}
