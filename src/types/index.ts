
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
  photoURL?: string | null;
  completedAchievements?: Record<string, Timestamp>;
  referralsMadeCount?: number;
  activeTheme?: string;
  unlockedThemes?: string[];
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
  type: 'redeem' | 'booster_purchase' | 'daily_bonus' | 'referral_bonus' | 'achievement_reward' | 'p2p_send' | 'p2p_receive' | string;
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
