
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
The ad URL MUST be a valid, complete, and absolute URL string (e.g., 'https://example.com/ad_target'). 
The ad should be suitable for display within an iframe and ideally be a banner-style ad (e.g. a static image with a link, or simple HTML content). Avoid direct links to full websites unless they are specifically designed to be embedded as an advertisement.
Do not return error messages or conversational text in the adUrl field. 
Explain your reasoning for choosing the ad.

Return the ad URL and the reasoning.
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

