
'use server';
/**
 * @fileOverview A personalized user tips AI agent.
 *
 * - personalizedTip - A function that handles generating personalized tips.
 */

import {ai} from '@/ai/genkit';
import { CONFIG } from '@/lib/constants';
import { PersonalizedTipInputSchema, PersonalizedTipOutputSchema, type PersonalizedTipInput, type PersonalizedTipOutput } from '@/types';

export async function personalizedTip(input: PersonalizedTipInput): Promise<PersonalizedTipOutput> {
  return personalizedTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTipPrompt',
  input: {schema: PersonalizedTipInputSchema},
  output: {schema: PersonalizedTipOutputSchema},
  prompt: `You are a friendly and helpful assistant for the "${CONFIG.APP_NAME}" tap-to-earn game. Your goal is to provide a concise, actionable, and personalized tip to the user based on their current in-game activity. The currency is called "${CONFIG.COIN_SYMBOL}".

User Data:
- Current Balance: {{currentBalance}} ${CONFIG.COIN_SYMBOL}
- Taps Today: {{tapCountToday}}
- Max Energy: {{maxEnergy}}
- Tap Power: {{tapPower}} ${CONFIG.COIN_SYMBOL}/tap
- Active Boosters: {{#if activeBoosters}}{{#each activeBoosters}}{{this.id}} (Lvl {{this.level}}){{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Recently Visited Pages: {{#if recentPageVisits}}{{#each recentPageVisits}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Achievements Completed: {{completedAchievementsCount}}
- Current Theme: {{activeTheme}}

Game Features available: Boosters (to increase tap power/energy), Achievements (rewards for goals), Quests (daily tasks for rewards), Themes (cosmetic upgrades), Leaderboard, Redeem (cash out ${CONFIG.COIN_SYMBOL}), P2P ${CONFIG.COIN_SYMBOL} transfers.

Analyze the user's data and provide ONE tip that would be most helpful or engaging for them RIGHT NOW.
Focus on one aspect. For example:
- If tap count is low, suggest tapping more.
- If balance is high enough for a booster they don't have, suggest it.
- If they haven't visited a key page (like quests or achievements) recently, suggest checking it out.
- If they just unlocked a theme, congratulate them.
- If they are close to an achievement, encourage them.

Keep the tip under 150 characters. Be encouraging and positive!

Example Tip: "Your tap power is looking good! Keep tapping to reach your next achievement!"
Example Tip: "Have you checked out the Daily Quests today? Easy ${CONFIG.COIN_SYMBOL} rewards await!"
Example Tip: "With {{currentBalance}} ${CONFIG.COIN_SYMBOL}, you could unlock a new Tap Power booster in the store!"
Example Tip: "Don't forget to claim your Daily Login Bonus for some free ${CONFIG.COIN_SYMBOL}!"
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

const getRandomDefaultTip = (): string => {
  if (CONFIG.DEFAULT_PERSONALIZED_TIPS && CONFIG.DEFAULT_PERSONALIZED_TIPS.length > 0) {
    const randomIndex = Math.floor(Math.random() * CONFIG.DEFAULT_PERSONALIZED_TIPS.length);
    return CONFIG.DEFAULT_PERSONALIZED_TIPS[randomIndex];
  }
  // Absolute fallback if the default list is somehow empty
  return `Keep tapping to earn more ${CONFIG.COIN_SYMBOL}! Explore all features for the best experience.`;
};

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
        console.warn("AI personalized tip prompt returned falsy or empty output. Using a default tip.");
        return {
          tip: getRandomDefaultTip(),
          confidence: 0.1 
        };
      }
      return output;
    } catch (error) {
      console.error("Error during personalized tip AI prompt execution, using a default tip:", error);
      return {
        tip: getRandomDefaultTip(),
        confidence: 0.1
      };
    }
  }
);

