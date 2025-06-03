
'use server';

import { mediateAd, type MediateAdInput, type MediateAdOutput } from '@/ai/flows/intelligent-ad-mediation';
import { 
  personalizedTip as personalizedTipFlow, // Renaming to avoid conflict if a wrapper is also named personalizedTip
  type PersonalizedTipInput, 
  type PersonalizedTipOutput 
} from '@/ai/flows/personalized-tips-flow.ts';

export async function getMediatedAd(input: MediateAdInput): Promise<MediateAdOutput | { error: string }> {
  try {
    const result = await mediateAd(input);
    return result;
  } catch (error) {
    console.error("Error in getMediatedAd server action:", error);
    return { error: "Failed to retrieve ad. Please try again later." };
  }
}

export async function getPersonalizedTip(input: PersonalizedTipInput): Promise<PersonalizedTipOutput | { error: string }> {
  try {
    const result = await personalizedTipFlow(input); // Calling the imported flow function
    return result;
  } catch (error: any) {
    console.error("Error in getPersonalizedTip server action:", error);
    return { error: error.message || "Failed to retrieve personalized tip." };
  }
}
