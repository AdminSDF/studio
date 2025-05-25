
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
  adUrl: z.string().url({ message: "Ad URL must be a valid URL." }).describe('The URL of the ad to display. This must be a complete and valid URL string (e.g., https://example.com/ad_target).'),
  reason: z.string().describe('The reason for displaying this ad.'),
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

You will use this information about the user's in-app activity to select an ad that is likely to improve their engagement and the app's monetization, without disrupting their experience.

Consider the following factors:

*   Tapping Frequency: {{tappingFrequency}}
*   Booster Usage: {{boosterUsage}}
*   Page Visits: {{pageVisits}}

Based on these inputs, select the best ad to display to the user.

The 'adUrl' field in your output MUST ALWAYS be a valid, complete, and absolute URL string (e.g., 'https://example.com/ad_target'). Do NOT put any other text, explanations, or error messages in the 'adUrl' field. It must solely be the URL.

The ad should be suitable for display within an iframe and ideally be a banner-style ad (e.g. a static image with a link, or simple HTML content). Avoid direct links to full websites unless they are specifically designed to be embedded as an advertisement.

Consider if a highly targeted ad is appropriate. If you determine that a specific ad is relevant based on the user's activity, provide its URL in the 'adUrl' field.

If, after considering the user's activity, you cannot identify a more specific or targeted ad, OR if the user's activity is low/neutral, you MUST default to providing the following high-performing Adsterra banner URL in the 'adUrl' field: 'https://syndication.adsterra.com/bn.php?ID=26645903&type=banner'. This is a 468x60 banner.

Explain your reasoning for choosing the ad in the 'reason' field. If you defaulted to the Adsterra banner, explain that a generic high-performing ad was selected due to [briefly state why, e.g., neutral user activity, lack of a more specific match].

Return the ad URL and the reasoning.
Remember: The 'adUrl' field MUST contain only the URL.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
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
        throw new Error('AI failed to generate ad data.');
    }
    // The z.string().url() in the schema ensures adUrl is a valid URL.
    // If the model returns something that's not a URL, the prompt() call itself will throw an error due to Zod validation.
    return output;
  }
);

