
'use client';

import React, { useEffect, useRef } from 'react'; // Added React import

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
  style = { display: 'block', textAlign: 'center' },
  layoutKey,
}) => {
  const insRef = useRef<HTMLModElement>(null); // Use HTMLModElement for <ins>

  useEffect(() => {
    const insElement = insRef.current;
    if (!insElement) return;

    // Check if AdSense has already processed this slot
    if (insElement.getAttribute('data-ad-status') === 'filled') {
      return; // Ad already loaded or attempted, don't push again
    }
    
    // Ensure the adsbygoogle array is available before pushing.
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error: ", e);
      }
    } else {
      // Optional: Retry if adsbygoogle is not immediately available.
      const timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense push error (delayed): ", e);
          }
        }
      }, 500); // Wait 500ms and try again
      return () => clearTimeout(timeoutId);
    }
  }, [adClient, adSlot, adFormat, layoutKey]); // Re-run if key properties change

  return (
    <div className={className} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef} // Attach ref here
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
