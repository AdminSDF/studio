
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
  style = { display: 'block', textAlign: 'center', width: '100%' }, // Ensure width is part of default style
  layoutKey,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const hasPushedRef = useRef(false); // Ref to track if push has been called for this instance

  useEffect(() => {
    const insElement = insRef.current;
    if (!insElement) return;

    // Only attempt to push if it hasn't been done for this instance
    if (!hasPushedRef.current) {
      // Delay slightly to allow DOM to settle, which might help with width calculation or other timing issues
      const timerId = setTimeout(() => {
        // Check if component is still mounted and AdSense script is available
        if (insRef.current && typeof window !== 'undefined' && (window as any).adsbygoogle) {
          try {
            // Check data-ad-status one last time before pushing, in case Auto Ads or another mechanism filled it
            if (insRef.current.getAttribute('data-ad-status') !== 'filled') {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              hasPushedRef.current = true; // Mark as pushed for this instance
            }
          } catch (e) {
            console.error("AdSense push error: ", e);
            // Optionally, to prevent repeated errors if the push itself fails consistently:
            // if (insRef.current) {
            //   insRef.current.setAttribute('data-ad-status', 'error');
            // }
          }
        }
      }, 100); // 100ms delay

      return () => clearTimeout(timerId); // Cleanup timeout if component unmounts
    }
  // adClient, adSlot, adFormat, layoutKey are dependencies that, if changed, should allow a new push attempt.
  // However, for a typical ad unit, these props don't change after mount.
  // If they *could* change and you'd want to re-initialize the ad, you'd reset hasPushedRef.current too.
  // For now, assuming they are static for the lifetime of this mounted component.
  }, [adClient, adSlot, adFormat, layoutKey]);

  return (
    // Ensure the outer div also attempts to take full width if a className doesn't override it.
    <div className={className} style={{ width: '100%' }} data-ai-hint="advertisement banner adsense">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={style} // The style prop should ideally include width: '100%'
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
        data-ad-layout-key={layoutKey}
      ></ins>
    </div>
  );
};
