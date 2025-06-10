
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
  const pushedOnceRef = useRef(false); // Tracks if push has been attempted for this instance

  useEffect(() => {
    const insElement = insRef.current;

    // If the ad slot element doesn't exist, or we've already tried to push ads to it,
    // or AdSense has already marked it as filled, then do nothing.
    if (!insElement || pushedOnceRef.current || insElement.getAttribute('data-ad-status') === 'filled') {
      return;
    }

    // Attempt to push ads only if the adsbygoogle global is available
    // This ensures the main AdSense script has loaded and initialized.
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        // adsbygoogle.push() expects an array, even if it's empty.
        // It processes all <ins> tags on the page that haven't been processed yet,
        // or the specific one if identified correctly (which is complex with responsive units).
        // A single push({}) is generally sufficient for auto-initializing units.
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedOnceRef.current = true; // Mark that we've attempted a push for this instance.
      } catch (e) {
        console.error("AdSense push error: ", e);
        // If push fails (e.g., due to invalid ad unit or other AdSense errors),
        // mark as pushed to prevent potential infinite retry loops if the component re-renders.
        pushedOnceRef.current = true;
      }
    }
    // If window.adsbygoogle is not yet available when this effect runs,
    // we don't do anything. The AdSense script, once it loads, should ideally
    // find and process the <ins> tags on the page automatically.
    // This useEffect will re-run if its dependencies change, giving another
    // chance if adsbygoogle loads later, but pushedOnceRef prevents multiple pushes.

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adClient, adSlot, adFormat, layoutKey]); // Dependencies that define the ad unit

  return (
    <div className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
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
