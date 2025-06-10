
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { AdSenseUnit } from './adsense-unit';
import { AdsterraScriptUnit } from './adsterra-script-unit';
import { CONFIG } from '@/lib/constants'; // Import CONFIG for AdSense Client ID

interface AdContainerProps {
  pageContext: string; // Still useful for context, though not used for AI now
  trigger: boolean;
}

const PREDEFINED_ADS: AdContent[] = [
  { adType: "url", adUrl: "https://www.profitableratecpm.com/c5ymb3kzy?key=f559b97247c5d0962536dc4beb353d1f", reason: "Selected: Adsterra DirectLink 1" },
  { adType: "url", adUrl: "https://www.profitableratecpm.com/pcxmp6uum?key=64dfbc0df5d616d4987111860b234b52", reason: "Selected: Adsterra DirectLink 2" },
  { adType: "url", adUrl: "https://www.profitableratecpm.com/xwqxaaa0?key=c61b1463cdcf7571c8b43ae732d1fc6e", reason: "Selected: Adsterra DirectLink 3" },
  { adType: "url", adUrl: "https://www.profitableratecpm.com/awkdrd8u7?key=cb1caf90ccdef2f4c51aff029a85a4f8", reason: "Selected: Adsterra DirectLink 4" },
  { adType: "url", adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner", reason: "Selected: Adsterra Generic Banner 468x60" },
  { adType: "adsense", adClient: CONFIG.ADSENSE_CLIENT_ID, adSlot: "9271312880", reason: "Selected: Google AdSense Banner" },
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" }
];


export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Kept for potential future async loading, but simple for now

  // Memoize the ads list to prevent re-creation on every render, though it's constant here.
  const availableAds = useMemo(() => PREDEFINED_ADS, []);

  useEffect(() => {
    function selectAd() {
      setIsLoading(true); // Simulate loading briefly
      setAd(null);

      if (availableAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        const selectedAd = availableAds[randomIndex];
        
        // For AdSense, ensure client ID is correctly sourced if it can change dynamically or needs verification
        if (selectedAd.adType === 'adsense') {
            setAd({ ...selectedAd, adClient: CONFIG.ADSENSE_CLIENT_ID });
        } else {
            setAd(selectedAd);
        }

      } else {
        console.warn("No predefined ads available to select.");
      }
      
      // Simulate loading completion
      setTimeout(() => setIsLoading(false), 100); // Short delay
    }

    if (trigger) {
      selectAd();
    } else {
      setAd(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds]); // pageContext removed as it's not used for AI anymore

  if (isLoading) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-muted/50 p-2 border-dashed">
        <CardContent className="p-2">
          <Skeleton className="h-[90px] w-full rounded-md" />
          <Skeleton className="h-4 w-1/2 mx-auto mt-2 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!ad) {
    return null;
  }

  // Simple error display if something went wrong with ad selection (though less likely now)
  if (ad.adType === 'url' && !ad.adUrl) {
      return (
        <Card className="w-full my-4 mx-auto text-center bg-destructive/10 p-2 border-dashed border-destructive">
            <CardContent className="p-2 text-destructive flex flex-col items-center justify-center">
            <AlertCircle className="h-5 w-5 mb-1" />
            <p className="text-xs">Ad URL missing for URL ad type.</p>
            </CardContent>
        </Card>
      )
  }
  if (ad.adType === 'adsense' && (!ad.adClient || !ad.adSlot)) {
    return (
        <Card className="w-full my-4 mx-auto text-center bg-destructive/10 p-2 border-dashed border-destructive">
            <CardContent className="p-2 text-destructive flex flex-col items-center justify-center">
            <AlertCircle className="h-5 w-5 mb-1" />
            <p className="text-xs">AdSense client or slot ID missing.</p>
            </CardContent>
        </Card>
      )
  }


  return (
    <Card className="w-full my-4 mx-auto text-center bg-card p-0 overflow-hidden shadow-md">
      <CardContent className="p-0 flex justify-center items-center">
        {ad.adType === 'adsense' && ad.adClient && ad.adSlot ? (
          <AdSenseUnit
            adClient={ad.adClient}
            adSlot={ad.adSlot}
            style={{ display: 'block', margin: 'auto' }}
            className="max-w-full"
          />
        ) : ad.adType === 'url' && ad.adUrl ? (
          <iframe
            src={ad.adUrl}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
            className="w-full h-[60px] sm:h-[90px] md:h-[100px]" // Standard banner sizes
            title="Advertisement"
            data-ai-hint="advertisement banner"
          ></iframe>
        ) : ad.adType === 'adsterra_script' ? (
          <AdsterraScriptUnit />
        ) : (
           <div className="p-4 text-sm text-muted-foreground">Invalid ad configuration received.</div>
        )}
      </CardContent>
      {/* Optional: Display reason for debugging/transparency
      {ad.reason && <p className="text-xs text-muted-foreground p-1 bg-muted/20">{ad.reason}</p>}
      */}
    </Card>
  );
}
