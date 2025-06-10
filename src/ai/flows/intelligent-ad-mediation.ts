
'use server';
/**
 * @fileOverview An intelligent ad mediation AI agent.
 *
 * - mediateAd - A function that handles the ad mediation process.
 */

import {ai} from '@/ai/genkit';
import { MediateAdInputSchema, MediateAdOutputSchema, type MediateAdInput, type MediateAdOutput } from '@/types';
import { CONFIG } from '@/lib/constants';

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

You have the following types of ads you can choose:

1.  **URL Ad**: Display an ad from a direct URL. For this, set \`adType: "url"\` and provide a valid, complete, and absolute URL string in the \`adUrl\` field.
    *   This can be a general banner-style ad URL suitable for an iframe (e.g., a 468x60 banner).
    *   **Alternatively, you can choose one of the following specific Adsterra Direct Links if they seem particularly appropriate based on the user context. If you choose one of these, ensure \`adUrl\` is set to the exact URL provided below:**
        *   Adsterra DirectLink 1: \`https://www.profitableratecpm.com/c5ymb3kzy?key=f559b97247c5d0962536dc4beb353d1f\`
        *   Adsterra DirectLink 2: \`https://www.profitableratecpm.com/pcxmp6uum?key=64dfbc0df5d616d4987111860b234b52\`
        *   Adsterra DirectLink 3: \`https://www.profitableratecpm.com/xwqxaaa0?key=c61b1463cdcf7571c8b43ae732d1fc6e\`
        *   Adsterra DirectLink 4: \`https://www.profitableratecpm.com/awkdrd8u7?key=cb1caf90ccdef2f4c51aff029a85a4f8\`

2.  **Google AdSense Ad**: Display a Google AdSense unit. For this, set \`adType: "adsense"\`, \`adClient: "${CONFIG.ADSENSE_CLIENT_ID}"\`, and \`adSlot: "9271312880"\`. Do NOT provide an \`adUrl\` if you choose AdSense. This is a standard AdSense banner.

3.  **Adsterra Script Ad**: Display an Adsterra ad using its JavaScript integration. For this, set \`adType: "adsterra_script"\`. No other ad-specific fields like \`adUrl\`, \`adClient\`, or \`adSlot\` are needed. This particular Adsterra unit will render a 728x90 banner.

If, after considering the user's activity, you cannot identify a specific or targeted ad (from the Adsterra Direct Links, AdSense, or Adsterra Script), OR if the user's activity is low/neutral, you MUST default to providing the following high-performing Adsterra URL banner:
Set \`adType: "url"\` and \`adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner"\`. This is a 468x60 banner.

Explain your reasoning for choosing the ad in the 'reason' field. If you defaulted to the 468x60 Adsterra URL banner, explain that a generic high-performing ad was selected due to [briefly state why, e.g., neutral user activity, lack of a more specific match].

Return the ad type, necessary fields (adUrl for 'url' type; adClient and adSlot for 'adsense' type; no specific fields for 'adsterra_script' beyond adType itself), and the reasoning.
Remember:
- If \`adType: "url"\`, the 'adUrl' field MUST contain only a valid and complete URL. It must not be conversational text, error messages, or partial URLs.
- If \`adType: "adsense"\`, 'adClient' (which should be '${CONFIG.ADSENSE_CLIENT_ID}') and 'adSlot' MUST be provided and 'adUrl' should be omitted or null.
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
      // Ensure AdSense client ID from config is used if AdSense is chosen
      if (output.adType === 'adsense') {
        output.adClient = CONFIG.ADSENSE_CLIENT_ID;
      }
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
