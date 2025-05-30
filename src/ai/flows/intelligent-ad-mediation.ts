
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
  adType: z.enum(['url', 'adsense', 'adsterra_script']).describe("The type of ad content to render. Use 'url' for direct ad links, 'adsense' for Google AdSense units, or 'adsterra_script' for a specific Adsterra JS-based ad unit (728x90)."),
  adUrl: z.string().url({ message: "Ad URL must be a valid URL." }).optional().describe("The URL of the ad to display if adType is 'url'. This must be a complete and valid URL string (e.g., https://example.com/ad_target). Do not provide conversational text or error messages here."),
  adClient: z.string().optional().describe("The AdSense client ID (e.g., ca-pub-XXXXXXXXXXXXXXXX) if adType is 'adsense'."),
  adSlot: z.string().optional().describe("The AdSense ad slot ID (e.g., YYYYYYYYYY) if adType is 'adsense'."),
  reason: z.string().describe('The reason for displaying this ad.'),
});
// Removed .refine() calls to make schema validation less strict at this stage.
// The AdContainer component will handle checks for required fields based on adType.

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

You have three types of ads you can choose:
1.  **URL Ad**: Display an ad from a direct URL. For this, set \`adType: "url"\` and provide a valid, complete, and absolute URL string in the \`adUrl\` field (e.g., 'https://example.com/ad_target'). The ad should be suitable for display within an iframe and ideally be a banner-style ad (e.g., 468x60). Avoid direct links to full websites unless they are specifically designed to be embedded. If using a general ad network banner URL, ensure it's a direct link to the banner creative, not a website landing page.
2.  **Google AdSense Ad**: Display a Google AdSense unit. For this, set \`adType: "adsense"\`, \`adClient: "ca-pub-9690805652184611"\`, and \`adSlot: "9271312880"\`. Do NOT provide an \`adUrl\` if you choose AdSense. This is a standard AdSense banner.
3.  **Adsterra Script Ad**: Display an Adsterra ad using its JavaScript integration. For this, set \`adType: "adsterra_script"\`. No other ad-specific fields like \`adUrl\`, \`adClient\`, or \`adSlot\` are needed. This particular Adsterra unit will render a 728x90 banner.

If, after considering the user's activity, you cannot identify a specific or targeted ad (URL, AdSense, or Adsterra Script), OR if the user's activity is low/neutral, you MUST default to providing the following high-performing Adsterra URL banner:
Set \`adType: "url"\` and \`adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner"\`. This is a 468x60 banner.

Explain your reasoning for choosing the ad in the 'reason' field. If you defaulted to the 468x60 Adsterra URL banner, explain that a generic high-performing ad was selected due to [briefly state why, e.g., neutral user activity, lack of a more specific match].

Return the ad type, necessary fields (adUrl for 'url' type; adClient and adSlot for 'adsense' type; no specific fields for 'adsterra_script' beyond adType itself), and the reasoning.
Remember:
- If \`adType: "url"\`, the 'adUrl' field MUST contain only a valid and complete URL. It must not be conversational text, error messages, or partial URLs.
- If \`adType: "adsense"\`, 'adClient' and 'adSlot' MUST be provided and 'adUrl' should be omitted or null.
- If \`adType: "adsterra_script"\`, no other ad-specific fields are needed from you.
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
  async (input): Promise<MediateAdOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        console.warn("AI prompt returned falsy output. Falling back to default ad.");
        return {
          adType: 'url',
          adUrl: 'https://syndication.adsterra.com/bn.php?ID=26645903&type=banner',
          reason: 'AI returned empty data, defaulting to high-performing URL banner.',
        };
      }
      // Basic validation still happens from Zod based on the object structure and types.
      // AdContainer component will perform further checks for conditional fields.
      return output;
    } catch (error) {
      console.error("Error during AI prompt execution or schema validation, falling back to default ad:", error);
      return {
        adType: 'url',
        adUrl: 'https://syndication.adsterra.com/bn.php?ID=26645903&type=banner',
        reason: 'AI response failed validation or prompt error, defaulting to high-performing URL banner.',
      };
    }
  }
);
