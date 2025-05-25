'use server';

import { mediateAd, type MediateAdInput, type MediateAdOutput } from '@/ai/flows/intelligent-ad-mediation';

export async function getMediatedAd(input: MediateAdInput): Promise<MediateAdOutput | { error: string }> {
  try {
    // You might want to add more validation or context manipulation here if needed
    const result = await mediateAd(input);
    return result;
  } catch (error) {
    console.error("Error in getMediatedAd server action:", error);
    return { error: "Failed to retrieve ad. Please try again later." };
  }
}
