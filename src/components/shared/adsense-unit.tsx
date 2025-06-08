
'use client';

import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  adClient: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  layoutKey?: string; // Optional: For ads with layout="in-article"
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className,
  style = { display: 'block', textAlign: 'center', width: '100%' }, // Ensure width & textAlign is part of default style
  layoutKey,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  // hasPushedRef removed as we are simplifying and relying on Auto Ads or natural processing

  useEffect(() => {
    // With Auto Ads enabled (via script in layout.tsx) and the <ins> tag correctly classed,
    // AdSense should automatically detect and process this ad unit.
    // Explicitly calling adsbygoogle.push({}) can sometimes conflict, especially if
    // Auto Ads has already found the slot, or if the slot has specific targeting
    // that Auto Ads handles.
    // We are relying on Auto Ads behavior or the natural processing of the ad slot
    // by the AdSense script.

    // If ads still don't appear, it could be due to:
    // 1. AdSense account issues (approval, policy violations).
    // 2. Insufficient content on the page for AdSense to target.
    // 3. The specific ad slot (`data-ad-slot`) not being configured for display or being new.
    // 4. Ad Blocker interference.

    // Example of a push call if needed (currently commented out):
    /*
    const insElement = insRef.current;
    if (!insElement) return;

    const timerId = setTimeout(() => {
      if (insRef.current && typeof window !== 'undefined' && (window as any).adsbygoogle) {
        if (insRef.current.getAttribute('data-ad-status') !== 'filled' && insRef.current.innerHTML.trim() === '') {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense push error: ", e);
          }
        }
      }
    }, 150); 

    return () => clearTimeout(timerId);
    */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adClient, adSlot, adFormat, layoutKey]); // Dependencies remain to re-evaluate if props change, though typically static

  return (
    <div className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef}
        className="adsbygoogle" // This class is key for AdSense to find the slot
        style={style} // style prop should include width: '100%' and textAlign: 'center'
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
        data-ad-layout-key={layoutKey}
      ></ins>
    </div>
  );
};
