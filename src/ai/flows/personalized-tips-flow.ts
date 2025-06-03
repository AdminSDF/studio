
'use server';
/**
 * @fileOverview A personalized user tips AI agent.
 *
 * - personalizedTip - A function that handles generating personalized tips.
 * - PersonalizedTipInput - The input type for the personalizedTip function.
 * - PersonalizedTipOutput - The return type for the personalizedTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CONFIG } from '@/lib/constants';

export const PersonalizedTipInputSchema = z.object({
  userId: z.string().describe("The user's unique identifier."),
  currentBalance: z.number().describe('The current in-app currency balance of the user.'),
  tapCountToday: z.number().describe('How many times the user has tapped today.'),
  maxEnergy: z.number().describe('The maximum energy capacity of the user.'),
  tapPower: z.number().describe('How much currency the user earns per tap.'),
  activeBoosters: z.array(z.object({
    id: z.string(),
    level: z.number(),
  })).describe('A list of boosters currently active for the user and their levels.'),
  recentPageVisits: z.array(z.string()).describe('A list of recently visited pages/features in the app (e.g., "mining", "boosters", "redeem").'),
  completedAchievementsCount: z.number().describe('The number of achievements the user has completed.'),
  activeTheme: z.string().describe('The name of the currently active theme.'),
});
export type PersonalizedTipInput = z.infer<typeof PersonalizedTipInputSchema>;

export const PersonalizedTipOutputSchema = z.object({
  tip: z.string().describe("A concise, actionable, and personalized tip for the user based on their activity. The tip should be encouraging and aim to improve their engagement or guide them towards useful features. Mention specific game elements like SDF coins, boosters, achievements, or themes if relevant. Keep it under 150 characters."),
  confidence: z.number().min(0).max(1).optional().describe("The AI's confidence in this tip's relevance (0 to 1)."),
});
export type PersonalizedTipOutput = z.infer<typeof PersonalizedTipOutputSchema>;

export async function personalizedTip(input: PersonalizedTipInput): Promise<PersonalizedTipOutput> {
  return personalizedTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTipPrompt',
  input: {schema: PersonalizedTipInputSchema},
  output: {schema: PersonalizedTipOutputSchema},
  prompt: `You are a friendly and helpful assistant for the "SDF Miner" tap-to-earn game. Your goal is to provide a concise, actionable, and personalized tip to the user based on their current in-game activity. The currency is called "SDF".

User Data:
- Current Balance: {{currentBalance}} SDF
- Taps Today: {{tapCountToday}}
- Max Energy: {{maxEnergy}}
- Tap Power: {{tapPower}} SDF/tap
- Active Boosters: {{#if activeBoosters}}{{#each activeBoosters}}{{this.id}} (Lvl {{this.level}}){{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Recently Visited Pages: {{#if recentPageVisits}}{{#each recentPageVisits}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Achievements Completed: {{completedAchievementsCount}}
- Current Theme: {{activeTheme}}

Game Features available: Boosters (to increase tap power/energy), Achievements (rewards for goals), Quests (daily tasks for rewards), Themes (cosmetic upgrades), Leaderboard, Redeem (cash out SDF), P2P SDF transfers.

Analyze the user's data and provide ONE tip that would be most helpful or engaging for them RIGHT NOW.
Focus on one aspect. For example:
- If tap count is low, suggest tapping more.
- If balance is high enough for a booster they don't have, suggest it.
- If they haven't visited a key page (like quests or achievements) recently, suggest checking it out.
- If they just unlocked a theme, congratulate them.
- If they are close to an achievement, encourage them.

Keep the tip under 150 characters. Be encouraging and positive!

Example Tip: "Your tap power is looking good! Keep tapping to reach your next achievement!"
Example Tip: "Have you checked out the Daily Quests today? Easy SDF rewards await!"
Example Tip: "With {{currentBalance}} SDF, you could unlock a new Tap Power booster in the store!"
Example Tip: "Don't forget to claim your Daily Login Bonus for some free SDF!"
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const personalizedTipFlow = ai.defineFlow(
  {
    name: 'personalizedTipFlow',
    inputSchema: PersonalizedTipInputSchema,
    outputSchema: PersonalizedTipOutputSchema,
  },
  async (input): Promise<PersonalizedTipOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.tip) {
        console.warn("AI personalized tip prompt returned falsy or empty output.");
        // Fallback tip or error handling can be more sophisticated
        return {
          tip: `Keep tapping to earn more ${CONFIG.COIN_SYMBOL}! Check out Boosters for an edge.`,
          confidence: 0.1
        };
      }
      return output;
    } catch (error) {
      console.error("Error during personalized tip AI prompt execution:", error);
      return {
        tip: `Explore all the features of ${CONFIG.APP_NAME} to maximize your earnings!`,
        confidence: 0.1
      };
    }
  }
);
