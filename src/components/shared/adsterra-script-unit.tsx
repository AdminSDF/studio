
'use client';

import Script from 'next/script';
import React, { useEffect, useRef } from 'react';

// Adsterra specific details from the provided script
const ADSTERRA_KEY = '1c6b13ce5dbe29ac74b8733ffa815179';
const ADSTERRA_WIDTH = 728;
const ADSTERRA_HEIGHT = 90;

export const AdsterraScriptUnit: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set window.atOptions before the Adsterra script loads.
    // This configuration is specific to the Adsterra ad unit.
    (window as any).atOptions = {
      'key': ADSTERRA_KEY,
      'format': 'iframe',
      'height': ADSTERRA_HEIGHT,
      'width': ADSTERRA_WIDTH,
      'params': {},
    };

    // Cleanup function to remove atOptions when the component unmounts.
    // This helps prevent conflicts if the component is re-mounted or
    // if other Adsterra ad units with different configurations are used elsewhere.
    return () => {
      if ((window as any).atOptions && (window as any).atOptions.key === ADSTERRA_KEY) {
        delete (window as any).atOptions;
      }
    };
  }, []); // Empty dependency array ensures this effect runs once on mount and cleanup on unmount.

  return (
    <div
      ref={adContainerRef}
      className="adsterra-script-container flex justify-center items-center"
      // This div will contain the ad. Adsterra's script will inject an iframe here.
      // The width is set to 100% to attempt to fit its parent.
      // However, the Adsterra script itself configures a 728px wide ad.
      // In an app with max-width 500px, this ad WILL OVERFLOW.
      // The overflow: 'hidden' style attempts to mitigate visual breaks by clipping the ad.
      style={{ width: '100%', height: `${ADSTERRA_HEIGHT}px`, overflow: 'hidden' }}
      data-ai-hint="advertisement banner script adsterra"
    >
      <Script
        id={`adsterra-invoke-${ADSTERRA_KEY}`} // Unique ID for the script tag
        src={`//www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js`}
        strategy="afterInteractive" // Load after the page becomes interactive
        onLoad={() => {
          // console.log(`Adsterra invoke.js (key: ${ADSTERRA_KEY}) loaded successfully.`);
          // Adsterra's script should now take over and render the ad within this component's div.
        }}
        onError={(e) => {
          console.error(`Adsterra invoke.js (key: ${ADSTERRA_KEY}) failed to load:`, e);
        }}
      />
    </div>
  );
};

