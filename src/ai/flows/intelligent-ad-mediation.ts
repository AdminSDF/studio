
'use server';
/**
 * @fileOverview An intelligent ad mediation AI agent.
 *
 * - mediateAd - A function that handles the ad mediation process.
 * - MediateAdInput - The input type for the mediateAd function.
 * - MediateAdOutput - The return type for the mediateAd function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MediateAdInputSchema = z.object({
  tappingFrequency: z
    .number()
    .describe('The frequency with which the user is tapping.'),
  boosterUsage: z.string().describe('The description of the booster usage.'),
  pageVisits: z.string().describe('The history of the page visits.'),
});
export type MediateAdInput = z.infer<typeof MediateAdInputSchema>;

const MediateAdOutputSchema = z.object({
  adType: z.enum(['url', 'adsense']).describe("The type of ad content to render. Use 'url' for direct ad links, or 'adsense' for Google AdSense units."),
  adUrl: z.string().url({ message: "Ad URL must be a valid URL." }).optional().describe("The URL of the ad to display if adType is 'url'. This must be a complete and valid URL string (e.g., https://example.com/ad_target)."),
  adClient: z.string().optional().describe("The AdSense client ID (e.g., ca-pub-XXXXXXXXXXXXXXXX) if adType is 'adsense'."),
  adSlot: z.string().optional().describe("The AdSense ad slot ID (e.g., YYYYYYYYYY) if adType is 'adsense'."),
  reason: z.string().describe('The reason for displaying this ad.'),
}).refine(data => {
  if (data.adType === 'url') {
    return !!data.adUrl;
  }
  return true;
}, {
  message: "adUrl is required when adType is 'url'",
  path: ["adUrl"],
}).refine(data => {
  if (data.adType === 'adsense') {
    return !!data.adClient && !!data.adSlot;
  }
  return true;
}, {
  message: "adClient and adSlot are required when adType is 'adsense'",
  path: ["adClient", "adSlot"],
});

export type MediateAdOutput = z.infer<typeof MediateAdOutputSchema>;

export async function mediateAd(input: MediateAdInput): Promise<MediateAdOutput> {
  return mediateAdFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mediateAdPrompt',
  input: {schema: MediateAdInputSchema},
  output: {schema: MediateAdOutputSchema},
  prompt: `You are an expert in ad mediation, specializing in selecting the most relevant and engaging ads for users of a mobile application.

You will use information about the user's in-app activity to select an ad that is likely to improve their engagement and the app's monetization, without disrupting their experience.

Consider the following factors:
*   Tapping Frequency: {{tappingFrequency}}
*   Booster Usage: {{boosterUsage}}
*   Page Visits: {{pageVisits}}

Based on these inputs, select the best ad to display to the user.

You have two types of ads you can choose:
1.  **URL Ad**: Display an ad from a direct URL. For this, set \`adType: "url"\` and provide a valid, complete, and absolute URL string in the \`adUrl\` field (e.g., 'https://example.com/ad_target'). The ad should be suitable for display within an iframe and ideally be a banner-style ad. Avoid direct links to full websites unless they are specifically designed to be embedded.
2.  **Google AdSense Ad**: Display a Google AdSense unit. For this, set \`adType: "adsense"\`, \`adClient: "ca-pub-9690805652184611"\`, and \`adSlot: "9271312880"\`. Do NOT provide an \`adUrl\` if you choose AdSense.

If, after considering the user's activity, you cannot identify a specific or targeted ad (either URL or AdSense), OR if the user's activity is low/neutral, you MUST default to providing the following high-performing Adsterra banner:
Set \`adType: "url"\` and \`adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner"\`. This is a 468x60 banner.

Explain your reasoning for choosing the ad in the 'reason' field. If you defaulted to the Adsterra banner, explain that a generic high-performing ad was selected due to [briefly state why, e.g., neutral user activity, lack of a more specific match].

Return the ad type, necessary fields (adUrl for 'url' type; adClient and adSlot for 'adsense' type), and the reasoning.
Remember:
- If \`adType: "url"\`, the 'adUrl' field MUST contain only the URL.
- If \`adType: "adsense"\`, 'adClient' and 'adSlot' MUST be provided and 'adUrl' should be omitted or null.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const mediateAdFlow = ai.defineFlow(
  {
    name: 'mediateAdFlow',
    inputSchema: MediateAdInputSchema,
    outputSchema: MediateAdOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback to Adsterra if AI fails to generate any valid output
        return {
            adType: 'url',
            adUrl: 'https://syndication.adsterra.com/bn.php?ID=26645903&type=banner',
            reason: 'AI failed to generate ad data, defaulting to high-performing banner.',
        };
    }
    // Zod schema validation (including .refine) will handle ensuring the output is correct.
    // If adType is 'url', adUrl must be present. If 'adsense', adClient and adSlot must be present.
    return output;
  }
);
