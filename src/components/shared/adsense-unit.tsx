
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
  style = { display: 'block', textAlign: 'center', width: '100%' },
  layoutKey,
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const hasPushedRef = useRef(false);

  useEffect(() => {
    const insElement = insRef.current;
    if (!insElement) return;

    // Only attempt to push if it hasn't been pushed for this instance
    // and if AdSense hasn't already marked it as filled.
    if (!hasPushedRef.current && insElement.getAttribute('data-ad-status') !== 'filled') {
      const timerId = setTimeout(() => {
        if (insRef.current && typeof window !== 'undefined' && (window as any).adsbygoogle) {
           // Double check status before push, as AdSense might have auto-initialized it during the timeout
          if (insRef.current.getAttribute('data-ad-status') !== 'filled') {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              hasPushedRef.current = true; // Mark as pushed for this instance
            } catch (e) {
              console.error("AdSense push error: ", e);
            }
          } else {
            hasPushedRef.current = true; // AdSense filled it, mark as processed.
          }
        }
      }, 150); // Small delay to allow DOM to settle and AdSense auto-init (if any)

      return () => clearTimeout(timerId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adClient, adSlot, adFormat, layoutKey]); // Re-run if ad unit props change

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
