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
  adUrl: z.string().describe('The URL of the ad to display.'),
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

Based on these inputs, select the best ad to display to the user. The ad URL MUST be a URL string. Explain your reasoning for choosing the ad.

Return the ad URL and the reasoning.
`,
});

const mediateAdFlow = ai.defineFlow(
  {
    name: 'mediateAdFlow',
    inputSchema: MediateAdInputSchema,
    outputSchema: MediateAdOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
