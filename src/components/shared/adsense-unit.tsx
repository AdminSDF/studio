
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
        // Ensure adsbygoogle is an array before pushing
        if (!Array.isArray((window as any).adsbygoogle)) {
            (window as any).adsbygoogle = [];
        }
        (window as any).adsbygoogle.push({});
        pushedOnceRef.current = true;
      } catch (e) {
        console.error("AdSense push error: ", e);
        // Consider it pushed even if error to avoid multiple retries in quick succession
        pushedOnceRef.current = true; 
      }
    }
  // Using a key on the parent or this component that changes with adSlot/adClient can help force re-renders
  // if needed, but useEffect dependencies should handle most cases.
  // Added adFormat and layoutKey to dependencies as they affect the ad unit.
  }, [adClient, adSlot, adFormat, layoutKey]); 

  // Unique key for the component to help React differentiate if multiple units are on a page
  // or if props change significantly enough to warrant a re-initialization.
  const componentKey = `${adClient}-${adSlot}-${layoutKey || 'default'}`;

  return (
    <div key={componentKey} className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef}
        className="adsbygoogle" // This class is targeted by AdSense
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
