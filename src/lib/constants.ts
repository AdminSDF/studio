
import type { Booster, Achievement, AppTheme, QuestDefinition } from '@/types';
import { Award, BarChartBig, CheckCircle, Palette, Gem, Zap, Sun, Sparkles, Brain, TrendingUp, Clock, Users, HelpingHand, Briefcase, Lightbulb, Star } from 'lucide-react';

export const CONFIG = {
  APP_NAME: "SDF Miner",
  COIN_SYMBOL: "SDF",
  MIN_REDEEM: 1000,
  CONVERSION_RATE: 0.01, // 1000 SDF = 10 INR => 1 SDF = 0.01 INR
  INITIAL_TAP_POWER: 0.1,
  INITIAL_MAX_ENERGY: 100,
  ENERGY_REGEN_RATE_PER_SECOND: 0.2,
  ENERGY_OVERFILL_CAP_MULTIPLIER: 1.1, // Can overfill up to 110% of maxEnergy
  DAILY_LOGIN_BONUS: 25, // SDF
  REFERRAL_BONUS_FOR_NEW_USER: 10, // SDF
  REFERRAL_MILESTONES: [
    { count: 1, reward: 20 },
    { count: 3, reward: 75 },
    { count: 5, reward: 150 },
  ],
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
      id: 'energy_regen_1', name: 'Energy Regen Boost I', description: 'Increase max energy significantly by 75.', // Note: Description mentions max energy, but effect_type is max_energy which is correct.
      cost: 150, effect_type: 'max_energy', value: 75, maxLevel: 3
    },
  ] as Booster[],
  MAX_TAPS_BEFORE_AD_CHECK: 20,
  TAP_FRENZY_CHANCE: 0.005, // 0.5% chance per tap
  TAP_FRENZY_DURATION_SECONDS: 30,
  TAP_FRENZY_MULTIPLIER: 3, // Tap power becomes 3x
  ENERGY_SURGE_CHANCE: 0.003, // 0.3% chance per tap
  ENERGY_SURGE_DURATION_SECONDS: 30, // Taps are free for this duration

  OFFLINE_EARNINGS_MAX_HOURS: 2, // Max hours to accumulate offline earnings
  OFFLINE_EARNINGS_EFFICIENCY_PERCENT: 0.1, // 10% of active earning potential
  MIN_OFFLINE_SECONDS_FOR_CALCULATION: 60, // Min 1 minute offline to trigger calculation

  DEFAULT_MARQUEE_ITEMS: [
    "🚀 Welcome to SDF Miner! Start Tapping!",
    "💰 Special Launch Bonus Active!",
    "🏆 Climb the leaderboards and show your might!",
    "🌟 Unlock achievements for bonus SDF!",
    "💡 Complete daily quests for extra rewards!",
  ],
  ACHIEVEMENTS: [
    { id: 'tapper_1', name: 'Novice Tapper', description: 'Tap 100 times today.', criteria: { type: 'tap_count_today', value: 100 }, reward: 5, icon: BarChartBig },
    { id: 'tapper_2', name: 'Adept Tapper', description: 'Tap 500 times today.', criteria: { type: 'tap_count_today', value: 500 }, reward: 20, icon: BarChartBig },
    { id: 'rich_1', name: 'Getting Started', description: `Reach a balance of 250 ${"SDF"}.`, criteria: { type: 'balance_reach', value: 250 }, reward: 15, icon: Gem },
    { id: 'booster_buyer_1', name: 'First Upgrade', description: 'Purchase any booster.', criteria: { type: 'booster_purchase_specific', value: 1, boosterId: 'any' }, reward: 10, icon: CheckCircle },
    { id: 'referrer_1', name: 'Friend Bringer', description: 'Successfully refer 1 friend.', criteria: { type: 'referrals_made', value: 1 }, reward: CONFIG.REFERRAL_MILESTONES.find(m => m.count ===1)?.reward || 20, icon: Award },
  ] as Achievement[],
  APP_THEMES: [
    { id: 'default_aqua', name: 'Default Aqua', cost: 0, cssClass: '', previewColors: { primary: 'hsl(170 70% 45%)', accent: 'hsl(10 80% 60%)', background: 'hsl(200 20% 98%)' } },
    { id: 'crimson_fire', name: 'Crimson Fire', cost: 1000, cssClass: 'theme-crimson-fire', previewColors: { primary: 'hsl(0 70% 50%)', accent: 'hsl(30 90% 55%)', background: 'hsl(0 0% 15%)' } },
    { id: 'emerald_forest', name: 'Emerald Forest', cost: 750, cssClass: 'theme-emerald-forest', previewColors: { primary: 'hsl(140 60% 45%)', accent: 'hsl(100 50% 50%)', background: 'hsl(120 10% 95%)' } },
    { id: 'neon_glow', name: 'Neon Glow', cost: 1200, cssClass: 'theme-neon-glow', previewColors: { primary: 'hsl(330 100% 60%)', accent: 'hsl(180 100% 50%)', background: 'hsl(220 15% 10%)' } },
    { id: 'solaris_flare', name: 'Solaris Flare', cost: 1500, cssClass: 'theme-solaris-flare', previewColors: { primary: 'hsl(30 100% 60%)', accent: 'hsl(50 100% 55%)', background: 'hsl(30 5% 15%)' } },
    { id: 'oceanic_calm', name: 'Oceanic Calm', cost: 900, cssClass: 'theme-oceanic-calm', previewColors: { primary: 'hsl(190 70% 50%)', accent: 'hsl(160 60% 65%)', background: 'hsl(210 100% 97%)' } },
    { id: 'sunset_vibes', name: 'Sunset Vibes', cost: 950, cssClass: 'theme-sunset-vibes', previewColors: { primary: 'hsl(10 85% 60%)', accent: 'hsl(340 70% 65%)', background: 'hsl(25 80% 94%)' } },
  ] as AppTheme[],
  LEADERBOARD_SIZE: 20,
  QUESTS: [
    // Daily Quests
    { id: 'daily_tap_100', name: 'Morning Taps', description: 'Tap 100 times.', criteria: { type: 'tap_count_total_session', value: 100 }, reward: 10, icon: TrendingUp, type: 'daily' },
    { id: 'daily_balance_50', name: 'Small Savings', description: `Earn 50 ${"SDF"} today (net gain).`, criteria: { type: 'balance_increase_session', value: 50 }, reward: 15, icon: Gem, type: 'daily' },
    { id: 'daily_watch_ad_1', name: 'Ad Viewer', description: 'Engage with an advertisement.', criteria: { type: 'interact_ad', value: 1 }, reward: 25, icon: Star, type: 'daily' }, // Placeholder, ad interaction tracking needed
    { id: 'daily_visit_boosters', name: 'Upgrade Explorer', description: 'Visit the Boosters page.', criteria: { type: 'visit_page', page: 'boosters' }, reward: 5, icon: Rocket, type: 'daily' },
  ] as QuestDefinition[],
  MAX_DAILY_QUESTS_ASSIGNED: 3,
  SUPPORT_TICKET_CATEGORIES: [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing/Redeem Problem' },
    { value: 'feedback', label: 'Feedback/Suggestion' },
    { value: 'account', label: 'Account Issue' },
  ],
  DEFAULT_FAQS: [
    { question: `How do I earn ${"SDF"}?`, answer: `You earn ${"SDF"} by tapping the main coin on the Mining page. You can also earn through daily bonuses, achievements, quests, and referrals.`, category: 'General', order: 1 },
    { question: 'What are boosters?', answer: 'Boosters are upgrades you can buy with SDF to increase your tap power or maximum energy, helping you earn faster.', category: 'Gameplay', order: 2 },
    { question: `How do I redeem my ${"SDF"}?`, answer: `Go to the Redeem page, enter the amount you want to withdraw (minimum ${1000} ${"SDF"}), choose your payment method, and fill in the details.`, category: 'Redeem', order: 3 },
    { question: 'How often do quests update?', answer: 'Daily quests update every 24 hours. Make sure to complete and claim them before they reset!', category: 'Quests', order: 4 },
    { question: 'Is my data safe?', answer: 'We prioritize your security. Your data is stored securely using Firebase, and we follow best practices to protect your information.', category: 'Account', order: 5 },
  ],
  AI_TIP_COOLDOWN_MINUTES: 5, // Minimum 5 minutes between showing AI tips
  AI_TIP_FETCH_PROBABILITY: 0.2, // 20% chance to fetch a tip when cooldown is over
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

// Helper to access referral milestone rewards
export const getReferralMilestoneReward = (count: number): number | undefined => {
  const milestone = CONFIG.REFERRAL_MILESTONES.find(m => m.count === count);
  return milestone?.reward;
};
