
'use client';

import Script from 'next/script';
import React, { useEffect, useRef } from 'react';

// New Adsterra specific details from user
const ADSTERRA_KEY = '1f340c53c7e804b1181cc1b8e2d1ae19';
const ADSTERRA_WIDTH = 468;
const ADSTERRA_HEIGHT = 60;

export const AdsterraScriptUnit468x60: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set window.atOptions before the Adsterra script loads.
    (window as any).atOptions = {
      'key': ADSTERRA_KEY,
      'format': 'iframe',
      'height': ADSTERRA_HEIGHT,
      'width': ADSTERRA_WIDTH,
      'params': {},
    };

    return () => {
      if ((window as any).atOptions && (window as any).atOptions.key === ADSTERRA_KEY) {
        delete (window as any).atOptions;
      }
    };
  }, []);

  return (
    <div
      ref={adContainerRef}
      className="adsterra-script-container-468x60 flex justify-center items-center"
      style={{ width: '100%', maxWidth: `${ADSTERRA_WIDTH}px`, height: `${ADSTERRA_HEIGHT}px`, overflow: 'hidden', margin: '0 auto' }}
      data-ai-hint="advertisement banner script adsterra"
    >
      <Script
        id={`adsterra-invoke-${ADSTERRA_KEY}`}
        src={`//www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js`}
        strategy="afterInteractive"
        onLoad={() => {
          // console.log(`Adsterra invoke.js (key: ${ADSTERRA_KEY}) loaded successfully.`);
        }}
        onError={(e) => {
          console.error(`Adsterra invoke.js (key: ${ADSTERRA_KEY}) failed to load:`, e);
        }}
      />
    </div>
  );
};
