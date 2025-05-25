'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Separator } from '@/components/ui/separator';
import { CONFIG } from '@/lib/constants';
import { Gem } from 'lucide-react'; // Using Gem as a separator icon

export function MarqueeBar() {
  const { marqueeItems } = useAppState();
  const displayItems = marqueeItems.length > 0 ? marqueeItems : CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({text}));

  return (
    <div className="bg-foreground text-background py-2 overflow-hidden whitespace-nowrap flex-shrink-0">
      <div className="animate-marquee-scroll inline-block hover:pause-animation">
        {displayItems.map((item, index) => (
          <span key={index} className="inline-flex items-center px-6 text-xs align-middle">
            {item.text}
            {index < displayItems.length - 1 && (
              <Gem className="ml-6 h-3 w-3 text-accent opacity-70" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
