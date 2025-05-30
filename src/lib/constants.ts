
import type { Booster, Achievement, AppTheme } from '@/types';
import { Award, BarChartBig, CheckCircle, Palette, Gem } from 'lucide-react'; // Added Palette

export const CONFIG = {
  APP_NAME: "Tap Titans", // Changed from SDF Miner
  COIN_SYMBOL: "TITAN", // Changed from SDF
  MIN_REDEEM: 100,
  CONVERSION_RATE: 0.1, // 1 TITAN = 0.1 INR
  INITIAL_TAP_POWER: 0.1,
  INITIAL_MAX_ENERGY: 100,
  ENERGY_REGEN_RATE_PER_SECOND: 0.2,
  DAILY_LOGIN_BONUS: 25,
  REFERRAL_BONUS_FOR_NEW_USER: 10,
  BOOSTERS: [
    {
      id: 'tap_power_1', name: 'Tap Power Boost I', description: `Increase tap power by 0.1 ${"TITAN"}.`,
      cost: 50, effect_type: 'tap_power', value: 0.1, maxLevel: 5
    },
    {
      id: 'max_energy_1', name: 'Max Energy Boost I', description: 'Increase max energy by 50.',
      cost: 30, effect_type: 'max_energy', value: 50, maxLevel: 5
    },
    {
      id: 'tap_power_2', name: 'Tap Power Boost II', description: `Increase tap power by 0.5 ${"TITAN"}.`,
      cost: 200, effect_type: 'tap_power', value: 0.5, maxLevel: 3 // New, more powerful booster
    },
    {
      id: 'energy_regen_1', name: 'Energy Regen Boost I', description: 'Slightly speeds up energy regeneration (effect simulated by reducing time between ticks).',
      cost: 150, effect_type: 'max_energy', value: 0, maxLevel: 3 // Placeholder for now, true regen rate change is complex. Let's say it adds a bit to max_energy as a proxy for now or it's a passive bonus not directly reflected in UserData. For simplicity, let's make this one increase max_energy too by a larger amount. It will increase Max Energy by 75.
      // True regen boost would need to modify ENERGY_REGEN_RATE_PER_SECOND based on user's boost level.
      // For now, making it a max_energy boost for simplicity.
      // To make it distinct: 'Increase max energy significantly by 75.'
    },
  ] as Booster[],
  MAX_TAPS_BEFORE_AD_CHECK: 20,
  DEFAULT_MARQUEE_ITEMS: [
    "🚀 Welcome to Tap Titans! Start Tapping!",
    "💰 Special Launch Bonus Active!",
    "🏆 Climb the leaderboards and show your might!",
    "🌟 Unlock achievements for bonus TITANs!",
  ],
  ACHIEVEMENTS: [
    { id: 'tapper_1', name: 'Novice Tapper', description: 'Tap 100 times today.', criteria: { type: 'tap_count_today', value: 100 }, reward: 5, icon: BarChartBig },
    { id: 'tapper_2', name: 'Adept Tapper', description: 'Tap 500 times today.', criteria: { type: 'tap_count_today', value: 500 }, reward: 20, icon: BarChartBig },
    { id: 'rich_1', name: 'Getting Started', description: 'Reach a balance of 250 TITANs.', criteria: { type: 'balance_reach', value: 250 }, reward: 15, icon: Gem },
    { id: 'booster_buyer_1', name: 'First Upgrade', description: 'Purchase any booster.', criteria: { type: 'booster_purchase_specific', value: 1, boosterId: 'any' }, reward: 10, icon: CheckCircle }, // 'any' means any booster
    { id: 'referrer_1', name: 'Friend Bringer', description: 'Successfully refer 1 friend.', criteria: { type: 'referrals_made', value: 1 }, reward: 20, icon: Award },
  ] as Achievement[],
  APP_THEMES: [
    { id: 'default_aqua', name: 'Default Aqua', cost: 0, cssClass: '', previewColors: { primary: 'hsl(170 70% 45%)', accent: 'hsl(10 80% 60%)', background: 'hsl(200 20% 98%)' } },
    { id: 'crimson_fire', name: 'Crimson Fire', cost: 1000, cssClass: 'theme-crimson-fire', previewColors: { primary: 'hsl(0 70% 50%)', accent: 'hsl(30 90% 55%)', background: 'hsl(0 0% 15%)' } },
    { id: 'emerald_forest', name: 'Emerald Forest', cost: 750, cssClass: 'theme-emerald-forest', previewColors: { primary: 'hsl(140 60% 45%)', accent: 'hsl(100 50% 50%)', background: 'hsl(120 10% 95%)' } },
  ] as AppTheme[],
  LEADERBOARD_SIZE: 20, // How many users to show on the leaderboard
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

// Update the specific booster description
const energyRegenBooster = CONFIG.BOOSTERS.find(b => b.id === 'energy_regen_1');
if (energyRegenBooster) {
  energyRegenBooster.description = 'Increase max energy significantly by 75.';
  energyRegenBooster.effect_type = 'max_energy'; // Confirming it's max_energy
  energyRegenBooster.value = 75; // Confirming value
}
