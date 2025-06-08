
import type { Booster, Achievement, AppTheme, QuestDefinition, FAQEntry, SupportTicketCategory } from '@/types';
import { Award, BarChartBig, CheckCircle, Palette, Gem, Zap, Sun, Sparkles, Brain, TrendingUp, Clock, Users, HelpingHand, Briefcase, Lightbulb, Star, Rocket } from 'lucide-react';

// Pre-defined constants to avoid "Cannot access before initialization" errors
const APP_NAME_VALUE = "SDF Miner";
const COIN_SYMBOL_VALUE = "SDF";
const MIN_REDEEM_VALUE = 1000;
const REFERRAL_MILESTONES_DATA = [
  { count: 1, reward: 20 },
  { count: 3, reward: 75 },
  { count: 5, reward: 150 },
];

export const CONFIG = {
  APP_NAME: APP_NAME_VALUE,
  COIN_SYMBOL: COIN_SYMBOL_VALUE,
  MIN_REDEEM: MIN_REDEEM_VALUE,
  CONVERSION_RATE: 0.01, // 1000 SDF = 10 INR => 1 SDF = 0.01 INR
  INITIAL_TAP_POWER: 0.1,
  INITIAL_MAX_ENERGY: 100,
  ENERGY_REGEN_RATE_PER_SECOND: 0.2,
  ENERGY_OVERFILL_CAP_MULTIPLIER: 1.1,
  DAILY_LOGIN_BONUS: 25, // SDF
  REFERRAL_BONUS_FOR_NEW_USER: 10, // SDF
  REFERRAL_MILESTONES: REFERRAL_MILESTONES_DATA,
  BOOSTERS: [
    {
      id: 'tap_power_1', name: 'Tap Power Boost I', description: `Increase tap power by 0.1 ${COIN_SYMBOL_VALUE}.`,
      cost: 50, effect_type: 'tap_power', value: 0.1, maxLevel: 5
    },
    {
      id: 'max_energy_1', name: 'Max Energy Boost I', description: 'Increase max energy by 50.',
      cost: 30, effect_type: 'max_energy', value: 50, maxLevel: 5
    },
    {
      id: 'tap_power_2', name: 'Tap Power Boost II', description: `Increase tap power by 0.5 ${COIN_SYMBOL_VALUE}.`,
      cost: 200, effect_type: 'tap_power', value: 0.5, maxLevel: 3
    },
    {
      id: 'energy_regen_1', name: 'Energy Regen Boost I', description: 'Increase max energy significantly by 75.',
      cost: 150, effect_type: 'max_energy', value: 75, maxLevel: 3
    },
  ] as Booster[],
  ACHIEVEMENTS: [
    { id: 'tapper_1', name: 'Novice Tapper', description: 'Tap 100 times today.', criteria: { type: 'tap_count_today', value: 100 }, reward: 5, icon: BarChartBig },
    { id: 'tapper_2', name: 'Adept Tapper', description: 'Tap 500 times today.', criteria: { type: 'tap_count_today', value: 500 }, reward: 20, icon: BarChartBig },
    { id: 'rich_1', name: 'Getting Started', description: `Reach a balance of 250 ${COIN_SYMBOL_VALUE}.`, criteria: { type: 'balance_reach', value: 250 }, reward: 15, icon: Gem },
    { id: 'booster_buyer_1', name: 'First Upgrade', description: 'Purchase any booster.', criteria: { type: 'booster_purchase_specific', value: 1, boosterId: 'any' }, reward: 10, icon: CheckCircle },
    { id: 'referrer_1', name: 'Friend Bringer', description: 'Successfully refer 1 friend.', criteria: { type: 'referrals_made', value: 1 }, reward: (REFERRAL_MILESTONES_DATA.find(m => m.count ===1)?.reward || 20), icon: Award },
  ] as Achievement[],
  MAX_TAPS_BEFORE_AD_CHECK: 20,
  TAP_FRENZY_CHANCE: 0.005,
  TAP_FRENZY_DURATION_SECONDS: 30,
  TAP_FRENZY_MULTIPLIER: 3,
  ENERGY_SURGE_CHANCE: 0.003,
  ENERGY_SURGE_DURATION_SECONDS: 30,

  OFFLINE_EARNINGS_MAX_HOURS: 2,
  OFFLINE_EARNINGS_EFFICIENCY_PERCENT: 0.1,
  MIN_OFFLINE_SECONDS_FOR_CALCULATION: 60,

  DEFAULT_MARQUEE_ITEMS: [
    `🚀 Welcome to ${APP_NAME_VALUE}! Start Tapping!`,
    "💰 Special Launch Bonus Active!",
    "🏆 Climb the leaderboards and show your might!",
    `🌟 Unlock achievements for bonus ${COIN_SYMBOL_VALUE}!`,
    "💡 Complete daily quests for extra rewards!",
  ],
  DEFAULT_PERSONALIZED_TIPS: [
    "Every tap gets you closer to your goal! Keep it up!",
    "Don't let your energy go to waste! Tap, tap, tap!",
    "Consistency is key in mining. Tap regularly!",
    "Remember to check back often and spend your energy.",
    "Set a personal tapping goal for the day and try to hit it!",
    "Feeling tired? Even a few taps are better than none!",
    "The more you tap, the more you earn. Simple as that!",
    "Your tapping finger is your greatest asset here!",
    "Have you tried tapping with a rhythm? Some find it more fun!",
    "Think of each tap as planting a seed for future riches!",
    "Energy full? Time for a tapping spree!",
    "Low on energy? It recharges over time, so check back soon.",
    "Did you know energy recharges even when you're not playing?",
    "Maximize your earnings by using up your energy before it's full.",
    "Keep an eye on your energy bar – don't let it sit at max for too long!",
    "Boosters can significantly increase your earnings. Check them out in the Boosts page!",
    `Save up your ${COIN_SYMBOL_VALUE} for a powerful booster upgrade!`,
    `Thinking of an upgrade? Tap Power boosters increase ${COIN_SYMBOL_VALUE} per tap.`,
    "Max Energy boosters let you tap for longer sessions!",
    "A well-chosen booster can be a game-changer.",
    "Some boosters are cheap to start with. A small investment can go a long way!",
    "Reaching max level on a booster is a great achievement!",
    `Achievements offer great ${COIN_SYMBOL_VALUE} rewards. Aim to complete them all!`,
    "Check the Goals page to see what achievements you're close to unlocking.",
    "New achievement unlocked? Don't forget to check the rewards!",
    "Each achievement completed shows your dedication!",
    `Daily Quests reset! Grab your new tasks for easy ${COIN_SYMBOL_VALUE}.`,
    `Complete your daily quests for a quick ${COIN_SYMBOL_VALUE} injection!`,
    "Quests are a fantastic way to boost your daily earnings.",
    "Stuck on what to do? Quests give you clear objectives.",
    "Personalize your app! Visit the Store to unlock new themes.",
    "A new theme can make your mining experience feel fresh!",
    `Save up ${COIN_SYMBOL_VALUE} to buy your favorite theme in the Store.`,
    "Express yourself with a cool new app theme!",
    "Getting close to the redeem minimum? Keep going!",
    "Dreaming of cashing out? The Redeem page is where the magic happens.",
    "Make sure your payment details are correct when you redeem!",
    `Share your referral ID with friends and earn bonus ${COIN_SYMBOL_VALUE}!`,
    "Referring friends helps both you and them get a head start.",
    "Check your Profile page for your unique referral ID.",
    "Want to see your name in lights? Climb the Leaderboard!",
    "Compete with other miners and aim for the top spot on the Leaderboard.",
    "The Leaderboard shows the top titans. Can you be one of them?",
    "Customize your profile with a cool picture!",
    "Keep your account secure by setting a strong password.",
    `Your profile shows your journey in ${APP_NAME_VALUE}. Make it awesome!`,
    `You earn ${COIN_SYMBOL_VALUE} even when you're offline! Claim it when you return.`,
    "Don't forget to log back in to collect your offline earnings.",
    "Believe in your taps! Great things are coming.",
    `Patience and persistence pay off in the world of ${COIN_SYMBOL_VALUE}.`,
    "Having fun? That's the most important part!",
    `Every bit of ${COIN_SYMBOL_VALUE} counts towards your fortune.`,
    "You're doing great! Keep up the fantastic mining.",
    "Small steps lead to big rewards. Keep tapping!",
    `The ${APP_NAME_VALUE} universe is vast. Explore all its features!`,
    `Don't forget your daily login bonus - free ${COIN_SYMBOL_VALUE} waiting for you!`,
    `The early tapper gets the ${COIN_SYMBOL_VALUE}! Or something like that.`,
    `What's your next ${COIN_SYMBOL_VALUE} goal? Aim high!`,
    "Challenge yourself to beat your previous day's earnings!",
    "Lost? The Help page might have the answers you seek!",
    `Sharing is caring! Tell your friends about ${APP_NAME_VALUE}.`,
    "Did you check for any active Frenzy or Surge events? They are awesome!",
    `Tap Power too low? Invest in boosters for bigger ${COIN_SYMBOL_VALUE} gains per tap!`,
    "Maxed out your energy? Consider upgrading your Max Energy booster for longer tapping sessions."
  ],
  APP_THEMES: [
    { id: 'default_aqua', name: 'Default Aqua', cost: 0, cssClass: '', previewColors: { primary: 'hsl(170 70% 45%)', accent: 'hsl(10 80% 60%)', background: 'hsl(200 20% 98%)' } },
    { id: 'futuristic_neon', name: 'Futuristic Neon', cost: 500, cssClass: 'theme-futuristic-neon', previewColors: { primary: 'hsl(180 60% 65%)', accent: 'hsl(320 70% 75%)', background: 'hsl(210 15% 96%)' } },
    { id: 'galaxy_glow', name: 'Galaxy Glow', cost: 600, cssClass: 'theme-galaxy-glow', previewColors: { primary: 'hsl(250 70% 80%)', accent: 'hsl(230 65% 75%)', background: 'hsl(0 0% 99%)' } },
    { id: 'dark_matte_light', name: 'Dark Matte (Light)', cost: 700, cssClass: 'theme-dark-matte-light', previewColors: { primary: 'hsl(220 40% 75%)', accent: 'hsl(210 20% 85%)', background: 'hsl(210 25% 94%)' } },
    { id: 'matrix_lite', name: 'Matrix Lite', cost: 800, cssClass: 'theme-matrix-lite', previewColors: { primary: 'hsl(150 60% 70%)', accent: 'hsl(70 45% 75%)', background: 'hsl(60 50% 96%)' } },
    { id: 'gold_rush', name: 'Gold Rush', cost: 900, cssClass: 'theme-gold-rush', previewColors: { primary: 'hsl(50 75% 75%)', accent: 'hsl(40 55% 85%)', background: 'hsl(45 30% 97%)' } },
    { id: 'minimal_classic', name: 'Minimal Classic', cost: 1000, cssClass: 'theme-minimal-classic', previewColors: { primary: 'hsl(180 55% 80%)', accent: 'hsl(210 15% 70%)', background: 'hsl(0 0% 100%)' } },
    { id: 'tech_blue', name: 'Tech Blue', cost: 1100, cssClass: 'theme-tech-blue', previewColors: { primary: 'hsl(200 80% 78%)', accent: 'hsl(210 50% 70%)', background: 'hsl(220 30% 98%)' } },
    { id: 'game_mode_light', name: 'Game Mode Light', cost: 1200, cssClass: 'theme-game-mode-light', previewColors: { primary: 'hsl(30 90% 75%)', accent: 'hsl(35 100% 88%)', background: 'hsl(40 100% 97%)' } },
    { id: 'gradient_aurora', name: 'Gradient Aurora', cost: 1300, cssClass: 'theme-gradient-aurora', previewColors: { primary: 'hsl(270 60% 80%)', accent: 'hsl(330 85% 85%)', background: 'hsl(40 80% 96%)' } },
    { id: 'industrial_soft', name: 'Industrial Soft', cost: 1400, cssClass: 'theme-industrial-soft', previewColors: { primary: 'hsl(25 75% 75%)', accent: 'hsl(210 20% 80%)', background: 'hsl(210 20% 97%)' } },
  ] as AppTheme[],
  LEADERBOARD_SIZE: 20,
  QUESTS: [
    { id: 'daily_tap_100', name: 'Morning Taps', description: 'Tap 100 times.', criteria: { type: 'tap_count_total_session', value: 100 }, reward: 10, iconName: "TrendingUp", type: 'daily' },
    { id: 'daily_balance_50', name: 'Small Savings', description: `Earn 50 ${COIN_SYMBOL_VALUE} today (net gain).`, criteria: { type: 'balance_increase_session', value: 50 }, reward: 15, iconName: "Gem", type: 'daily' },
    { id: 'daily_watch_ad_1', name: 'Ad Viewer', description: 'Engage with an advertisement.', criteria: { type: 'interact_ad', value: 1 }, reward: 25, iconName: "Star", type: 'daily' },
    { id: 'daily_visit_boosters', name: 'Upgrade Explorer', description: 'Visit the Boosters page.', criteria: { type: 'visit_page', page: 'boosters' }, reward: 5, iconName: "Rocket", type: 'daily' },
  ] as QuestDefinition[],
  MAX_DAILY_QUESTS_ASSIGNED: 3,
  SUPPORT_TICKET_CATEGORIES: [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing/Redeem Problem' },
    { value: 'feedback', label: 'Feedback/Suggestion' },
    { value: 'account', label: 'Account Issue' },
  ] as SupportTicketCategory[],
  DEFAULT_FAQS: [
    { question: `How do I earn ${COIN_SYMBOL_VALUE}?`, answer: `You earn ${COIN_SYMBOL_VALUE} by tapping the main coin on the Mining page. You can also earn through daily bonuses, achievements, quests, and referrals.`, category: 'General', order: 1, iconName: "Lightbulb" },
    { question: 'What are boosters?', answer: `Boosters are upgrades you can buy with ${COIN_SYMBOL_VALUE} to increase your tap power or maximum energy, helping you earn faster.`, category: 'Gameplay', order: 2, iconName: "Zap" },
    { question: `How do I redeem my ${COIN_SYMBOL_VALUE}?`, answer: `Go to the Redeem page, enter the amount you want to withdraw (minimum ${MIN_REDEEM_VALUE} ${COIN_SYMBOL_VALUE}), choose your payment method, and fill in the details.`, category: 'Redeem', order: 3, iconName: "Briefcase" },
    { question: 'How often do quests update?', answer: 'Daily quests update every 24 hours. Make sure to complete and claim them before they reset!', category: 'Quests', order: 4, iconName: "Star" },
    { question: 'Is my data safe?', answer: 'We prioritize your security. Your data is stored securely using Firebase, and we follow best practices to protect your information.', category: 'Account', order: 5, iconName: "Users" },
    { question: 'What is P2P Transfer?', answer: `P2P (Peer-to-Peer) Transfer allows you to send ${COIN_SYMBOL_VALUE} coins directly to another ${APP_NAME_VALUE} user using their unique User ID.`, category: 'Redeem', order: 6, iconName: "Users" },
    { question: 'Where can I find my User ID?', answer: 'Your User ID is shown on your Profile page. You can copy it or show the QR code to others.', category: 'Profile', order: 7, iconName: "Users" },
  ] as FAQEntry[],
  AI_TIP_COOLDOWN_MINUTES: 5,
  AI_TIP_FETCH_PROBABILITY: 0.2,
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

export const getReferralMilestoneReward = (count: number): number | undefined => {
  const milestone = CONFIG.REFERRAL_MILESTONES.find(m => m.count === count);
  return milestone?.reward;
};

