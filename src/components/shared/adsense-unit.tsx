
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
  // hasPushedRef is no longer strictly necessary if we remove the push logic,
  // but keeping it for now in case we need to revert or add conditional pushes later.
  const hasPushedRef = useRef(false); 

  useEffect(() => {
    // With Auto Ads enabled via the main script in layout.tsx,
    // explicitly calling adsbygoogle.push({}) for individual ad units
    // might not always be necessary and can sometimes cause conflicts
    // or errors if AdSense has already processed the page or the specific slot.
    //
    // We are removing the explicit push to rely more on Auto Ads behavior
    // or the natural processing of ad slots by the AdSense script.
    //
    // If ads still don't appear, it could be due to:
    // 1. AdSense account issues (approval, policy violations).
    // 2. Insufficient content on the page for AdSense to target.
    // 3. The specific ad slot (`data-ad-slot`) not being configured for display or being new.
    // 4. Ad Blocker interference (though not from Firebase itself).

    // If, after testing, specific ad units still require a manual push (e.g., if Auto Ads are disabled
    // or not picking up these slots), the following logic could be re-introduced with careful checks:
    /*
    const insElement = insRef.current;
    if (!insElement) return;

    if (!hasPushedRef.current) {
      const timerId = setTimeout(() => {
        if (insRef.current && typeof window !== 'undefined' && (window as any).adsbygoogle) {
          // Check if ad already filled by Auto Ads or previous attempt
          if (insRef.current.getAttribute('data-ad-status') !== 'filled' && insRef.current.innerHTML.trim() === '') {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              hasPushedRef.current = true;
            } catch (e) {
              console.error("AdSense push error: ", e);
            }
          }
        }
      }, 150); // Slightly increased delay

      return () => clearTimeout(timerId);
    }
    */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adClient, adSlot, adFormat, layoutKey]); // Dependencies remain to re-evaluate if props change, though typically static

  return (
    <div className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef}
        className="adsbygoogle"
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
