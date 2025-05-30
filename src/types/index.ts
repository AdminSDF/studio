
import type { Timestamp } from 'firebase/firestore';

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
  icon?: any; // Lucide icon component
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
  // New fields for suggested features
  completedAchievements?: Record<string, Timestamp>; // { achievementId: completionTimestamp }
  referralsMadeCount?: number;
  activeTheme?: string; // ID of the active theme
  unlockedThemes?: string[]; // Array of unlocked theme IDs
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
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: 'redeem' | 'booster_purchase' | 'daily_bonus' | 'referral_bonus' | 'achievement_reward' | string;
  inrAmount?: number;
  paymentMethod?: PaymentMethod | string;
  paymentDetails?: PaymentDetails;
  status: 'pending' | 'completed' | 'failed';
  date: Date | Timestamp;
  details?: string;
}

export interface MarqueeItem {
  text: string;
}

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
