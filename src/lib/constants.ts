export type Booster = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect_type: 'tap_power' | 'max_energy';
  value: number;
  maxLevel: number;
};

export const CONFIG = {
  APP_NAME: "SDF Miner",
  COIN_SYMBOL: "SDF",
  MIN_REDEEM: 100,
  CONVERSION_RATE: 0.1, // 1 SDF = 0.1 INR
  INITIAL_TAP_POWER: 0.1,
  INITIAL_MAX_ENERGY: 100,
  ENERGY_REGEN_RATE_PER_SECOND: 0.2, // Energy points per second
  DAILY_LOGIN_BONUS: 25,
  REFERRAL_BONUS_FOR_NEW_USER: 10,
  BOOSTERS: [
    {
      id: 'tap_power_1', name: 'Tap Power Boost I', description: `Increase tap power by 0.1 ${"SDF"}.`,
      cost: 50, effect_type: 'tap_power', value: 0.1, maxLevel: 5
    },
    {
      id: 'max_energy_1', name: 'Max Energy Boost I', description: 'Increase max energy by 50.',
      cost: 30, effect_type: 'max_energy', value: 50, maxLevel: 5
    },
    // Add more boosters here if needed
  ] as Booster[],
  MAX_TAPS_BEFORE_AD_CHECK: 20, // Number of taps before attempting to show an AI mediated ad
  DEFAULT_MARQUEE_ITEMS: [
    "🚀 Welcome to SDF Miner! Start Tapping!",
    "💰 Special Launch Bonus Active!",
  ]
};

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCh8IEsAOM2DA7TDXKQPqL0VucUlq22Y2U",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sadaf-f96b6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sadaf-f96b6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sadaf-f96b6.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "909344479505",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:909344479505:web:e628d50f2c42c1d5c694b0",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y56WF24030"
};
