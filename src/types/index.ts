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
  lastTapDate: string | null; // Store as ISO string or Date string
  currentEnergy: number;
  maxEnergy: number;
  tapPower: number;
  lastEnergyUpdate: Date | Timestamp | null;
  boostLevels: Record<string, number>; // e.g., { 'tap_power_1': 2, 'max_energy_1': 1 }
  lastLoginBonusClaimed: Date | Timestamp | null;
  referredBy: string | null;
  createdAt: Date | Timestamp | null;
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
  date: Date | Timestamp;
  details?: string; // For booster name or other info
}

export interface MarqueeItem {
  text: string;
}

export interface AdContent {
  adUrl: string;
  reason: string;
}
