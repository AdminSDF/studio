
'use client';

import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  adClient: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  layoutKey?: string;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className,
  style = { display: 'block', textAlign: 'center', width: '100%' },
  layoutKey,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushedOnceRef = useRef(false);

  useEffect(() => {
    const insElement = insRef.current;

    if (!insElement || pushedOnceRef.current || insElement.getAttribute('data-ad-status') === 'filled') {
      return;
    }

    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedOnceRef.current = true;
      } catch (e) {
        console.error("AdSense push error: ", e);
        pushedOnceRef.current = true;
      }
    }
  }, [adClient, adSlot, adFormat, layoutKey]); // Include all props that define the ad unit

  // Using adClient and adSlot in the key to force re-mount if these critical props change
  const componentKey = `${adClient}-${adSlot}`;

  return (
    <div key={componentKey} className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
        data-ad-layout-key={layoutKey}
      ></ins>
    </div>
  );
};
