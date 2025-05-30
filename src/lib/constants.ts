
import type { Booster, Achievement, AppTheme } from '@/types';
import { Award, BarChartBig, CheckCircle, Palette, Gem, Zap, Sun, Sparkles } from 'lucide-react'; // Added Zap, Sun, Sparkles for theme previews

export const CONFIG = {
  APP_NAME: "SDF Miner",
  COIN_SYMBOL: "SDF",
  MIN_REDEEM: 1000,
  CONVERSION_RATE: 0.01, // 1000 SDF = 10 INR => 1 SDF = 0.01 INR
  INITIAL_TAP_POWER: 0.1,
  INITIAL_MAX_ENERGY: 100,
  ENERGY_REGEN_RATE_PER_SECOND: 0.2,
  DAILY_LOGIN_BONUS: 25, // SDF
  REFERRAL_BONUS_FOR_NEW_USER: 10, // SDF
  BOOSTERS: [
    {
      id: 'tap_power_1', name: 'Tap Power Boost I', description: `Increase tap power by 0.1 ${"SDF"}.`,
      cost: 50, effect_type: 'tap_power', value: 0.1, maxLevel: 5
    },
    {
      id: 'max_energy_1', name: 'Max Energy Boost I', description: 'Increase max energy by 50.',
      cost: 30, effect_type: 'max_energy', value: 50, maxLevel: 5
    },
    {
      id: 'tap_power_2', name: 'Tap Power Boost II', description: `Increase tap power by 0.5 ${"SDF"}.`,
      cost: 200, effect_type: 'tap_power', value: 0.5, maxLevel: 3
    },
    {
      id: 'energy_regen_1', name: 'Energy Regen Boost I', description: 'Increase max energy significantly by 75.',
      cost: 150, effect_type: 'max_energy', value: 75, maxLevel: 3
    },
  ] as Booster[],
  MAX_TAPS_BEFORE_AD_CHECK: 20,
  DEFAULT_MARQUEE_ITEMS: [
    "🚀 Welcome to SDF Miner! Start Tapping!",
    "💰 Special Launch Bonus Active!",
    "🏆 Climb the leaderboards and show your might!",
    "🌟 Unlock achievements for bonus SDF!",
  ],
  ACHIEVEMENTS: [
    { id: 'tapper_1', name: 'Novice Tapper', description: 'Tap 100 times today.', criteria: { type: 'tap_count_today', value: 100 }, reward: 5, icon: BarChartBig },
    { id: 'tapper_2', name: 'Adept Tapper', description: 'Tap 500 times today.', criteria: { type: 'tap_count_today', value: 500 }, reward: 20, icon: BarChartBig },
    { id: 'rich_1', name: 'Getting Started', description: `Reach a balance of 250 ${"SDF"}s.`, criteria: { type: 'balance_reach', value: 250 }, reward: 15, icon: Gem },
    { id: 'booster_buyer_1', name: 'First Upgrade', description: 'Purchase any booster.', criteria: { type: 'booster_purchase_specific', value: 1, boosterId: 'any' }, reward: 10, icon: CheckCircle },
    { id: 'referrer_1', name: 'Friend Bringer', description: 'Successfully refer 1 friend.', criteria: { type: 'referrals_made', value: 1 }, reward: 20, icon: Award },
  ] as Achievement[],
  APP_THEMES: [
    { id: 'default_aqua', name: 'Default Aqua', cost: 0, cssClass: '', previewColors: { primary: 'hsl(170 70% 45%)', accent: 'hsl(10 80% 60%)', background: 'hsl(200 20% 98%)' } },
    { id: 'crimson_fire', name: 'Crimson Fire', cost: 1000, cssClass: 'theme-crimson-fire', previewColors: { primary: 'hsl(0 70% 50%)', accent: 'hsl(30 90% 55%)', background: 'hsl(0 0% 15%)' } },
    { id: 'emerald_forest', name: 'Emerald Forest', cost: 750, cssClass: 'theme-emerald-forest', previewColors: { primary: 'hsl(140 60% 45%)', accent: 'hsl(100 50% 50%)', background: 'hsl(120 10% 95%)' } },
    { id: 'neon_glow', name: 'Neon Glow', cost: 1200, cssClass: 'theme-neon-glow', previewColors: { primary: 'hsl(330 100% 60%)', accent: 'hsl(180 100% 50%)', background: 'hsl(220 15% 10%)' } },
    { id: 'solaris_flare', name: 'Solaris Flare', cost: 1500, cssClass: 'theme-solaris-flare', previewColors: { primary: 'hsl(30 100% 60%)', accent: 'hsl(50 100% 55%)', background: 'hsl(30 5% 15%)' } },
  ] as AppTheme[],
  LEADERBOARD_SIZE: 20,
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

