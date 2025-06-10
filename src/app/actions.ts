
'use server';

// import { mediateAd as mediateAdFlow } from '@/ai/flows/intelligent-ad-mediation'; // Removed
import { personalizedTip as personalizedTipFlow } from '@/ai/flows/personalized-tips-flow';
import type { /* MediateAdInput, MediateAdOutput, */ PersonalizedTipInput, PersonalizedTipOutput } from '@/types'; // MediateAd types removed

/* // Removed getMediatedAd function as AI ad mediation is disabled
export async function getMediatedAd(input: MediateAdInput): Promise<MediateAdOutput | { error: string }> {
  try {
    const result = await mediateAdFlow(input);
    return result;
  } catch (error) {
    console.error("Error in getMediatedAd server action:", error);
    return { error: "Failed to retrieve ad. Please try again later." };
  }
}
*/

export async function getPersonalizedTip(input: PersonalizedTipInput): Promise<PersonalizedTipOutput | { error: string }> {
  try {
    const result = await personalizedTipFlow(input);
    return result;
  } catch (error: any) {
    console.error("Error in getPersonalizedTip server action:", error);
    return { error: error.message || "Failed to retrieve personalized tip." };
  }
}
