
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  joinDate: Date | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'tap_count_today' | 'balance_reach' | 'booster_purchase_specific' | 'referrals_made';
    value: number; // Target value for tap_count_today, balance_reach, referrals_made
    boosterId?: string; // For booster_purchase_specific
  };
  reward: number; // Coin reward
  iconName?: string; // Changed from icon: any to iconName: string
}

export interface AppTheme {
  id: string;
  name: string;
  cost: number;
  cssClass: string; // CSS class to apply to the body/html
  previewColors: { primary: string; accent: string; background: string };
}

export interface UserData {
  balance: number;
  tapCountToday: number;
  lastTapDate: string | null;
  currentEnergy: number;
  maxEnergy: number;
  tapPower: number;
  lastEnergyUpdate: Date | null;
  boostLevels: Record<string, number>;
  lastLoginBonusClaimed: Date | null;
  referredBy: string | null;
  createdAt: Date | null;
  name?: string;
  email?: string;
  photoURL?: string | null;
  photoStoragePath?: string | null; // Added to store the actual storage path
  completedAchievements?: Record<string, Timestamp>;
  referralsMadeCount?: number;
  activeTheme?: string;
  unlockedThemes?: string[];
  frenzyEndTime?: Date | Timestamp | null;
  frenzyMultiplier?: number | null;
  energySurgeEndTime?: Date | Timestamp | null;
}

export type PaymentMethod = 'upi' | 'bank' | 'paytm' | 'googlepay' | 'phonepay' | '';

export interface PaymentDetails {
  upiId?: string;
  upiName?: string;
  accNumber?: string;
  confirmAcc?: string;
  ifsc?: string;
  accName?: string;
  bankName?: string;
  number?: string;
  name?: string;
}

export interface Transaction {
  id: string;
  userId: string; // The user whose transaction history this belongs to
  userName?: string; // Name of the user (optional, for display)
  userEmail?: string; // Email of the user (optional, for display)
  amount: number; // Always positive. For sends/debits, it's an outgoing amount. For receives/credits, it's incoming.
  type: 'redeem' | 'booster_purchase' | 'daily_bonus' | 'referral_bonus' | 'achievement_reward' | 'p2p_send' | 'p2p_receive' | 'quest_reward' | 'theme_purchase' | 'offline_earnings' | string;
  inrAmount?: number; // For redeem transactions
  paymentMethod?: PaymentMethod | string; // For redeem transactions
  paymentDetails?: PaymentDetails; // For redeem transactions
  status: 'pending' | 'completed' | 'failed';
  date: Date | Timestamp;
  details?: string; // E.g., booster name, achievement name
  relatedUserId?: string; // For P2P, this would be the other party's ID
  relatedUserName?: string; // For P2P, this would be the other party's name
}

export interface MarqueeItem {
  text: string;
}

// Zod Schemas and Types for Ad Mediation
export const MediateAdInputSchema = z.object({
  tappingFrequency: z
    .number()
    .describe('The frequency with which the user is tapping.'),
  boosterUsage: z.string().describe('The description of the booster usage.'),
  pageVisits: z.string().describe('The history of the page visits.'),
});
export type MediateAdInput = z.infer<typeof MediateAdInputSchema>;

export const MediateAdOutputSchema = z.object({
  adType: z.enum(['url', 'adsense', 'adsterra_script']).describe("The type of ad content to render. Use 'url' for direct ad links, 'adsense' for Google AdSense units, or 'adsterra_script' for a specific Adsterra JS-based ad unit (728x90)."),
  adUrl: z.string().url({ message: "Ad URL must be a valid URL." }).optional().describe("The URL of the ad to display if adType is 'url'. This must be a complete and valid URL string (e.g., https://example.com/ad_target). Do not provide conversational text or error messages here."),
  adClient: z.string().optional().describe("The AdSense client ID (e.g., ca-pub-XXXXXXXXXXXXXXXX) if adType is 'adsense'."),
  adSlot: z.string().optional().describe("The AdSense ad slot ID (e.g., YYYYYYYYYY) if adType is 'adsense'."),
  reason: z.string().describe('The reason for displaying this ad.'),
});
export type MediateAdOutput = z.infer<typeof MediateAdOutputSchema>;

// Zod Schemas and Types for Personalized Tips
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


// Keep AdContent separate as it's used internally by AdContainer
export interface AdContent {
  adType: 'url' | 'adsense' | 'adsterra_script';
  adUrl?: string;
  adClient?: string;
  adSlot?: string;
  reason: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  balance: number;
  rank?: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: 'tap_count_total_session' | 'balance_increase_session' | 'visit_page' | 'booster_purchase_specific' | 'interact_ad';
    value: number;
    page?: string; // For 'visit_page'
    boosterId?: string; // For 'booster_purchase_specific'
  };
  reward: number;
  iconName: string; // Changed from React.ElementType to string
  type: 'daily' | 'weekly' | 'event'; // Type of quest
}

export interface UserQuest {
  id: string; // This will be the questId from QuestDefinition
  definition: QuestDefinition;
  progress: number;
  completed: boolean;
  claimed: boolean;
  assignedAt: Date | Timestamp; // When the quest instance was created/assigned for the user
  lastProgressAt?: Date | Timestamp; // Optional: when progress was last updated
}

export interface FAQEntry {
  id?: string; // Optional Firestore document ID
  question: string;
  answer: string;
  category: string;
  order: number;
  iconName?: string; // Changed from icon: React.ElementType to store icon name as string
}

export interface SupportTicketCategory {
  value: string;
  label: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  adminResponse?: string;
}

// Types for html5-qrcode library, if not globally available
// Based on common usage, actual types might be more complex.
export interface Html5QrcodeError {
  errorMessage: string;
  type?: number; // Or some other error code/type from the library
  name?: string; // e.g., NotAllowedError
}

export interface Html5QrcodeResult {
  decodedText: string;
  result: {
    format?: {
      formatName?: string; // e.g., "QR_CODE"
    };
    // other properties from the library's result object
  };
}
