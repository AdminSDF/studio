import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  joinDate: Date | null;
}

export interface UserData {
  balance: number;
  tapCountToday: number;
  lastTapDate: string | null; // Stored as Date string 'YYYY-MM-DD' or full Date().toDateString() in local state
  currentEnergy: number;
  maxEnergy: number;
  tapPower: number;
  lastEnergyUpdate: Date | null; // In local state, this is a JS Date object or null
  boostLevels: Record<string, number>; // e.g., { 'tap_power_1': 2, 'max_energy_1': 1 }
  lastLoginBonusClaimed: Date | null; // In local state, this is a JS Date object or null
  referredBy: string | null;
  createdAt: Date | null; // In local state, this is a JS Date object or null
  name?: string; // From auth profile
  email?: string; // From auth profile
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
  number?: string; // For paytm, googlepay, phonepay
  name?: string; // For paytm, googlepay, phonepay
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: 'redeem' | 'booster_purchase' | 'daily_bonus' | 'referral_bonus' | string; // Allow custom types
  inrAmount?: number;
  paymentMethod?: PaymentMethod | string;
  paymentDetails?: PaymentDetails;
  status: 'pending' | 'completed' | 'failed';
  date: Date | Timestamp; // Can be Timestamp when read from Firestore, converted to Date for state
  details?: string; // For booster name or other info
}

export interface MarqueeItem {
  text: string;
}

export interface AdContent {
  adType: 'url' | 'adsense';
  adUrl?: string; // Required if adType is 'url'
  adClient?: string; // Required if adType is 'adsense'
  adSlot?: string; // Required if adType is 'adsense'
  reason: string;
}
