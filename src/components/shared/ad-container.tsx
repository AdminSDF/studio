
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { AdSenseUnit } from './adsense-unit';
import { AdsterraScriptUnit } from './adsterra-script-unit';
import { CONFIG } from '@/lib/constants';

interface AdContainerProps {
  pageContext: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableAds = useMemo(() => PREDEFINED_ADS, []);

  useEffect(() => {
    function selectAd() {
      setIsLoading(true);
      setError(null);
      setAd(null);

      if (availableAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        let selectedAd = availableAds[randomIndex];
        
        if (selectedAd.adType === 'adsense') {
            if (!CONFIG.ADSENSE_CLIENT_ID) {
                console.error("AdSense Client ID is not configured in CONFIG.");
                setError("AdSense Client ID missing. Cannot load AdSense ad.");
                selectedAd = PREDEFINED_ADS.find(ad => ad.adType === 'url' && ad.adUrl === "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner") || null; // Fallback to a generic banner
            } else {
                 selectedAd = { ...selectedAd, adClient: CONFIG.ADSENSE_CLIENT_ID };
            }
        }
        setAd(selectedAd);
      } else {
        console.warn("No predefined ads available to select.");
        setError("No ads configured for display.");
      }
      
      setTimeout(() => setIsLoading(false), 100);
    }

    // Only trigger ad selection if the trigger is true.
    // If trigger becomes false, it implies the ad should be hidden or reset.
    if (trigger) {
      selectAd();
    } else {
      setAd(null);
      setIsLoading(false);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds]);

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

  if (error) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-destructive/10 p-2 border-dashed border-destructive">
          <CardContent className="p-2 text-destructive flex flex-col items-center justify-center">
          <AlertCircle className="h-5 w-5 mb-1" />
          <p className="text-xs">{error}</p>
          </CardContent>
      </Card>
    )
  }

  if (!ad) {
    return null;
  }

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
    // This specific check might be redundant if the setError for missing CONFIG.ADSENSE_CLIENT_ID fires first
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
      <CardContent className="p-0 flex justify-center items-center min-h-[60px] sm:min-h-[90px] md:min-h-[100px]">
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
            className="w-full h-[60px] sm:h-[90px] md:h-[100px]"
            title="Advertisement"
            data-ai-hint="advertisement banner"
          ></iframe>
        ) : ad.adType === 'adsterra_script' ? (
          <AdsterraScriptUnit />
        ) : (
           <div className="p-4 text-sm text-muted-foreground">Error: Could not determine ad type.</div>
        )}
      </CardContent>
    </Card>
  );
}
