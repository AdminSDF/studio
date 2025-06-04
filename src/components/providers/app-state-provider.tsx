
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, Timestamp, setDoc, updateDoc, collection, query, where, orderBy, getDocs,
  runTransaction, writeBatch, serverTimestamp, increment, DocumentData, FirestoreError, limit, collectionGroup
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import type { UserData, Transaction, MarqueeItem, LeaderboardEntry, Achievement, UserProfile, QuestDefinition, UserQuest, FAQEntry, SupportTicket, PersonalizedTipInput, Booster, AppTheme } from '@/types';
import { useAuth } from './auth-provider';
import { CONFIG, getReferralMilestoneReward } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';
import { getPersonalizedTip } from '@/app/actions';

interface AppStateContextType {
  userData: UserData | null;
  transactions: Transaction[];
  marqueeItems: MarqueeItem[];
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  userQuests: UserQuest[];
  faqs: FAQEntry[];
  loadingUserData: boolean;
  loadingLeaderboard: boolean;
  loadingAchievements: boolean;
  loadingQuests: boolean;
  loadingFaqs: boolean;
  setUserDataState: (data: UserData | null) => void;
  fetchUserData: () => Promise<void>;
  updateUserFirestoreData: (data: Partial<UserData>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'date'>) => Promise<void>;
  updateEnergy: (newEnergy: number, lastUpdate: Date) => void;
  purchaseBooster: (boosterId: string) => Promise<void>;
  claimDailyBonus: () => Promise<void>;
  submitRedeemRequest: (amount: number, paymentMethod: string, paymentDetails: any) => Promise<void>;
  resetUserProgress: () => Promise<void>;
  isOnline: boolean;
  pageHistory: string[];
  addPageVisit: (page: string) => void;
  fetchLeaderboardData: () => Promise<void>;
  checkAndAwardAchievements: () => Promise<void>;
  purchaseTheme: (themeId: string) => Promise<boolean>;
  setActiveThemeState: (themeId: string) => void;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  transferToUser: (recipientId: string, amount: number, recipientName?: string) => Promise<boolean>;
  refreshUserQuests: () => Promise<void>;
  claimQuestReward: (questId: string) => Promise<void>;
  updateQuestProgress: (questId: string, progressIncrement: number) => Promise<void>;
  submitSupportTicket: (category: string, description: string) => Promise<boolean>;
  fetchFaqs: () => Promise<void>;
  currentPersonalizedTip: string | null;
  getAndSetPersonalizedTip: () => Promise<void>;
  triggerTapFrenzy: () => void;
  triggerEnergySurge: () => void;
  showOfflineEarningsModal: boolean;
  offlineEarnedAmount: number;
  closeOfflineEarningsModal: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text })));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements] = useState<Achievement[]>(CONFIG.ACHIEVEMENTS);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [currentPersonalizedTip, setCurrentPersonalizedTip] = useState<string | null>(null);
  const lastTipFetchTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const [showOfflineEarningsModal, setShowOfflineEarningsModal] = useState(false);
  const [offlineEarnedAmount, setOfflineEarnedAmount] = useState(0);

  const closeOfflineEarningsModal = useCallback(() => {
    setShowOfflineEarningsModal(false);
    setOfflineEarnedAmount(0);
  }, []);


  const addPageVisit = useCallback((page: string) => {
    setPageHistory(prev => [...prev, page].slice(-10)); // Keep last 10 visits
    if (page === 'boosters' || page === 'store' || page === 'profile') {
      updateQuestProgress('daily_visit_boosters', 1); // Example: Specific quest update on page visit
    }
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        toast({ title: "Offline", description: "You are currently offline. Some features may be limited.", variant: "destructive" });
      } else {
         toast({ title: "Online", description: "You are back online!", variant: "default" });
      }
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [toast]);

  const fetchMarqueeItems = useCallback(async () => {
    try {
      const newsDocRef = doc(db, 'app_settings', 'news_ticker');
      const newsDoc = await getDoc(newsDocRef);
      if (newsDoc.exists()) {
        const items = newsDoc.data()?.items as string[];
        if (items && items.length > 0) {
          setMarqueeItems(items.map(text => ({ text })));
        }
      }
    } catch (error) {
      console.error("Error fetching marquee items:", error);
    }
  }, []);

  const processFirestoreData = useCallback((data: DocumentData, currentAuthUser: UserProfile | null): UserData => {
    const now = new Date();
    const parseTimestampOrDate = (value: any, defaultValue: Date): Date => {
      if (value instanceof Timestamp) return value.toDate();
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      return defaultValue;
    };
    const parseNullableTimestampOrDate = (value: any): Date | null => {
        if (value instanceof Timestamp) return value.toDate();
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
          const d = new Date(value);
          if (!isNaN(d.getTime())) return d;
        }
        return null;
      };


    return {
      balance: data.balance ?? 0,
      tapCountToday: data.tapCountToday ?? 0,
      currentEnergy: data.currentEnergy ?? CONFIG.INITIAL_MAX_ENERGY,
      maxEnergy: data.maxEnergy ?? CONFIG.INITIAL_MAX_ENERGY,
      tapPower: data.tapPower ?? CONFIG.INITIAL_TAP_POWER,
      boostLevels: data.boostLevels ?? {},
      referredBy: data.referredBy ?? null,
      name: data.name ?? currentAuthUser?.name ?? 'New User',
      email: data.email ?? currentAuthUser?.email ?? '',
      photoURL: data.photoURL ?? null,
      lastTapDate: typeof data.lastTapDate === 'string' ? data.lastTapDate : (data.lastTapDate instanceof Timestamp ? data.lastTapDate.toDate().toDateString() : now.toDateString()),
      lastEnergyUpdate: parseTimestampOrDate(data.lastEnergyUpdate, now),
      lastLoginBonusClaimed: parseNullableTimestampOrDate(data.lastLoginBonusClaimed),
      createdAt: parseTimestampOrDate(data.createdAt, new Date(currentAuthUser?.joinDate || Date.now())),
      completedAchievements: data.completedAchievements ?? {},
      referralsMadeCount: data.referralsMadeCount ?? 0,
      activeTheme: data.activeTheme ?? CONFIG.APP_THEMES[0].id,
      unlockedThemes: data.unlockedThemes ?? [CONFIG.APP_THEMES[0].id],
      frenzyEndTime: parseNullableTimestampOrDate(data.frenzyEndTime),
      frenzyMultiplier: data.frenzyMultiplier ?? null,
      energySurgeEndTime: parseNullableTimestampOrDate(data.energySurgeEndTime),
    };
  }, []);

  const updateUserFirestoreData = useCallback(async (dataToUpdate: Partial<UserData>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.id);
      const firestoreReadyData: Partial<DocumentData> = { ...dataToUpdate, updatedAt: serverTimestamp() };

      if (dataToUpdate.lastEnergyUpdate instanceof Date) {
        firestoreReadyData.lastEnergyUpdate = Timestamp.fromDate(dataToUpdate.lastEnergyUpdate);
      }
      if (dataToUpdate.lastLoginBonusClaimed instanceof Date) {
        firestoreReadyData.lastLoginBonusClaimed = Timestamp.fromDate(dataToUpdate.lastLoginBonusClaimed);
      }
      if (dataToUpdate.frenzyEndTime instanceof Date) {
        firestoreReadyData.frenzyEndTime = Timestamp.fromDate(dataToUpdate.frenzyEndTime);
      } else if (dataToUpdate.frenzyEndTime === null) {
        firestoreReadyData.frenzyEndTime = null;
      }
      if (dataToUpdate.energySurgeEndTime instanceof Date) {
        firestoreReadyData.energySurgeEndTime = Timestamp.fromDate(dataToUpdate.energySurgeEndTime);
      } else if (dataToUpdate.energySurgeEndTime === null) {
        firestoreReadyData.energySurgeEndTime = null;
      }
      // lastTapDate is stored as string, no conversion needed here.
      await updateDoc(userDocRef, firestoreReadyData);
    } catch (error) {
      console.error("Error updating user data:", error);
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    }
  }, [user, toast]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'userId' | 'date'>) => {
    if (!user) return;
    try {
      const newTransactionRef = doc(collection(db, 'transactions'));
      const newTransaction: Transaction = {
        ...transactionData,
        id: newTransactionRef.id,
        userId: user.id,
        date: serverTimestamp() as Timestamp,
      };
      await setDoc(newTransactionRef, newTransaction);

      setTransactions(prev => [{ ...transactionData, id: newTransactionRef.id, userId: user.id, date: new Date() } as Transaction, ...prev].sort((a, b) => (((b.date as any) || 0) instanceof Timestamp ? (b.date as Timestamp).toMillis() : new Date(b.date as any || 0).getTime()) - (((a.date as any) || 0) instanceof Timestamp ? (a.date as Timestamp).toMillis() : new Date(a.date as any || 0).getTime())));
      // toast({ title: "Success", description: `${String(transactionData.type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} recorded.`, variant: "default" });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Failed to record transaction.", variant: "destructive" });
    }
  }, [user, toast]);

  const fetchUserData = useCallback(async () => {
    if (!user || !firebaseUser) {
      setUserDataState(null);
      setLoadingUserData(false);
      return;
    }
    setLoadingUserData(true);
    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const processedData = processFirestoreData(data, user);
        setUserDataState(processedData);

        // Offline Earnings Calculation
        const lastActivity = processedData.lastEnergyUpdate ? processedData.lastEnergyUpdate.getTime() : (processedData.createdAt ? processedData.createdAt.getTime() : Date.now());
        const currentTime = Date.now();
        const timeDiffSeconds = Math.floor((currentTime - lastActivity) / 1000);

        if (timeDiffSeconds >= CONFIG.MIN_OFFLINE_SECONDS_FOR_CALCULATION) {
          const eligibleOfflineTimeSeconds = Math.min(timeDiffSeconds, CONFIG.OFFLINE_EARNINGS_MAX_HOURS * 3600);
          
          const potentialActiveEarningsPerSecond = processedData.tapPower * CONFIG.ENERGY_REGEN_RATE_PER_SECOND;
          const offlineEarningsPerSecond = potentialActiveEarningsPerSecond * CONFIG.OFFLINE_EARNINGS_EFFICIENCY_PERCENT;
          const totalOfflineEarned = Math.floor(offlineEarningsPerSecond * eligibleOfflineTimeSeconds);

          if (totalOfflineEarned > 0) {
            setOfflineEarnedAmount(totalOfflineEarned);
            setShowOfflineEarningsModal(true);
            // Balance update and transaction will happen when modal is closed/claimed
          } else {
             // If no earnings, still update lastEnergyUpdate to prevent re-calculation immediately
             // unless modal is shown. If modal shown, it handles update.
            await updateUserFirestoreData({ lastEnergyUpdate: new Date(currentTime) });
          }
        }

      } else {
        const now = new Date();
        const newUserDefault: UserData = {
          balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(),
          currentEnergy: CONFIG.INITIAL_MAX_ENERGY, maxEnergy: CONFIG.INITIAL_MAX_ENERGY,
          tapPower: CONFIG.INITIAL_TAP_POWER, lastEnergyUpdate: now, boostLevels: {},
          lastLoginBonusClaimed: null, referredBy: null,
          createdAt: new Date(user.joinDate || Date.now()),
          name: user.name || 'New User', email: user.email || '',
          photoURL: null,
          completedAchievements: {}, referralsMadeCount: 0,
          activeTheme: CONFIG.APP_THEMES[0].id, unlockedThemes: [CONFIG.APP_THEMES[0].id],
          frenzyEndTime: null, frenzyMultiplier: null, energySurgeEndTime: null,
        };
        await setDoc(userDocRef, {
          ...newUserDefault,
          lastEnergyUpdate: Timestamp.fromDate(newUserDefault.lastEnergyUpdate as Date),
          lastLoginBonusClaimed: newUserDefault.lastLoginBonusClaimed ? Timestamp.fromDate(newUserDefault.lastLoginBonusClaimed as Date) : null,
          createdAt: Timestamp.fromDate(newUserDefault.createdAt as Date),
        });
        setUserDataState(newUserDefault);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({ title: "Error", description: "Could not load your data.", variant: "destructive" });
    } finally {
      setLoadingUserData(false);
    }
  }, [user, firebaseUser, toast, processFirestoreData, setUserDataState, updateUserFirestoreData]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', user.id), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const userTransactions = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let transactionDate: Date;
        if (data.date instanceof Timestamp) {
          transactionDate = data.date.toDate();
        } else if (data.date instanceof Date) {
          transactionDate = data.date;
        } else {
          // Fallback for potentially malformed data or older entries; consider logging this
          transactionDate = new Date();
        }
        return { id: docSnap.id, ...data, date: transactionDate } as Transaction;
      });
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({ title: "Error", description: "Could not load transaction history.", variant: "destructive" });
    }
  }, [user, toast]);

  const fetchLeaderboardData = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'users'), orderBy('balance', 'desc'), limit(CONFIG.LEADERBOARD_SIZE));
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        return {
          userId: docSnap.id,
          name: data.name || 'Anonymous Titan',
          balance: data.balance || 0,
          rank: index + 1,
        } as LeaderboardEntry;
      });
      setLeaderboard(leaderboardData);
    } catch (error: any) {
      console.error("Detailed error fetching leaderboard data:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let description = "Could not load leaderboard. Please try again later.";
      if (error.code === 'failed-precondition') {
        description = "Leaderboard: Index missing on 'users' for 'balance' (desc). Create in Firebase console.";
      } else if (error.code === 'permission-denied') {
        description = "Leaderboard: Permission denied. Check Firestore security rules for 'users' collection.";
      }
      toast({ title: "Leaderboard Error", description, variant: "destructive", duration: 5000 });
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [toast]);

  const checkAndAwardAchievements = useCallback(async () => {
    if (!userData || !user) return;
    setLoadingAchievements(true);
    const currentCompletedAchievements = userData.completedAchievements || {};
    let newAchievementsAwarded = false;

    for (const achievement of CONFIG.ACHIEVEMENTS) {
      if (currentCompletedAchievements[achievement.id]) {
        continue;
      }

      let criteriaMet = false;
      switch (achievement.criteria.type) {
        case 'tap_count_today':
          criteriaMet = userData.tapCountToday >= achievement.criteria.value;
          break;
        case 'balance_reach':
          criteriaMet = userData.balance >= achievement.criteria.value;
          break;
        case 'referrals_made':
          criteriaMet = (userData.referralsMadeCount || 0) >= achievement.criteria.value;
          break;
        case 'booster_purchase_specific':
          if (achievement.criteria.boosterId === 'any') {
            criteriaMet = Object.values(userData.boostLevels || {}).some(level => (level as number) > 0);
          } else {
            criteriaMet = (userData.boostLevels?.[achievement.criteria.boosterId!] || 0) >= achievement.criteria.value;
          }
          break;
      }

      if (criteriaMet) {
        newAchievementsAwarded = true;
        const userRef = doc(db, 'users', user.id);
        try {
          await runTransaction(db, async (firestoreTransaction) => {
            const userDoc = await firestoreTransaction.get(userRef);
            if (!userDoc.exists()) throw "User document does not exist!";

            const serverUserData = userDoc.data();
            const serverCompletedAchievements = serverUserData.completedAchievements || {};
            if (serverCompletedAchievements[achievement.id]) return;

            firestoreTransaction.update(userRef, {
              balance: increment(achievement.reward),
              [`completedAchievements.${achievement.id}`]: serverTimestamp(),
            });
          });
          await addTransaction({
            amount: achievement.reward,
            type: 'achievement_reward',
            status: 'completed',
            details: achievement.name,
          });
          toast({ title: "Achievement Unlocked!", description: `You earned ${achievement.reward} ${CONFIG.COIN_SYMBOL} for ${achievement.name}!`, variant: "default" });
          // Local state will update via snapshot listener
        } catch (error) {
          console.error("Error awarding achievement transaction:", error);
        }
      }
    }
    if (newAchievementsAwarded) {
        // await fetchUserData(); // Re-fetch to get updated balance and completed achievements locally.
    }
    setLoadingAchievements(false);
  }, [userData, user, addTransaction, toast]);


  const checkAndAwardReferralMilestones = useCallback(async () => {
    if (!user || !userData || !userData.referralsMadeCount) return;

    for (const milestone of CONFIG.REFERRAL_MILESTONES) {
      if (userData.referralsMadeCount >= milestone.count) {
        const achievementIdForMilestone = `referral_milestone_${milestone.count}`;
        if (!userData.completedAchievements?.[achievementIdForMilestone]) {
          try {
            const userRef = doc(db, 'users', user.id);
            await runTransaction(db, async (transaction) => {
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists()) throw "User doc missing";
              const currentData = userDoc.data() as UserData;
              if (currentData.completedAchievements?.[achievementIdForMilestone]) return; // Already awarded

              transaction.update(userRef, {
                balance: increment(milestone.reward),
                [`completedAchievements.${achievementIdForMilestone}`]: serverTimestamp(),
              });
            });

            await addTransaction({
              amount: milestone.reward,
              type: 'referral_bonus',
              status: 'completed',
              details: `Reached ${milestone.count} referrals milestone`,
            });
            toast({ title: "Referral Milestone!", description: `You earned ${milestone.reward} ${CONFIG.COIN_SYMBOL} for referring ${milestone.count} friends!`, variant: "default" });
             // Local state will update via snapshot.
          } catch (error) {
            console.error("Error awarding referral milestone:", error);
          }
        }
      }
    }
  }, [user, userData, addTransaction, toast]);


  // Effect for initial data loading and setting up listeners
  useEffect(() => {
    if (user && !authLoading) {
      fetchUserData(); // This will now also trigger initial offline earnings check
      fetchTransactions();
      fetchMarqueeItems();
      fetchLeaderboardData();
      fetchFaqs(); // Fetch FAQs on load
      refreshUserQuests(); // Fetch/Refresh quests on load

      const userDocRef = doc(db, 'users', user.id);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newUserData = processFirestoreData(data, user);
          setUserDataState(newUserData);
        }
      }, (error: FirestoreError) => {
        console.error("Error in user snapshot listener:", error);
        toast({ title: "Sync Error", description: "Could not sync user data. Try refreshing.", variant: "destructive" });
      });

      const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.id), orderBy('date', 'desc'));
      const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
        const userTransactions = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          let transactionDate: Date;
          if (data.date instanceof Timestamp) {
            transactionDate = data.date.toDate();
          } else if (data.date instanceof Date) {
            transactionDate = data.date;
          } else {
            transactionDate = new Date();
          }
          return { id: docSnap.id, ...data, date: transactionDate } as Transaction;
        });
        setTransactions(userTransactions);
      }, (error: FirestoreError) => {
        console.error("Error in transaction snapshot listener:", error);
        let description = "Could not listen for transaction updates.";
        if (error.code === 'failed-precondition') {
          description = "Transactions require an index: userId (asc), date (desc). Create it in Firebase console.";
        } else if (error.code === 'permission-denied') {
          description = "Permission denied for transactions. Check Firestore security rules.";
        }
        toast({ title: "Database Error", description, variant: "destructive", duration: 5000 });
      });

      const userQuestsRef = doc(db, 'user_quests', user.id);
      const unsubscribeUserQuests = onSnapshot(userQuestsRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lastRefresh = data.lastQuestRefresh ? (data.lastQuestRefresh as Timestamp).toDate() : null;
          const today = new Date();
          // If last refresh was not today, refresh quests
          if (!lastRefresh || lastRefresh.toDateString() !== today.toDateString()) {
            await refreshUserQuests();
          } else {
            // Fetch details for active quests
            const activeQuestIds = data.activeDailyQuestIds || [];
            const fetchedQuests: UserQuest[] = [];
            for (const questId of activeQuestIds) {
              const questDetailRef = doc(db, `user_quests/${user.id}/daily_quests`, questId);
              const questDetailSnap = await getDoc(questDetailRef);
              if (questDetailSnap.exists()) {
                fetchedQuests.push({ id: questId, ...questDetailSnap.data() } as UserQuest);
              }
            }
            setUserQuests(fetchedQuests);
          }
        } else {
          // No quest document, refresh to create one
          await refreshUserQuests();
        }
      });


      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
        unsubscribeUserQuests();
      };

    } else if (!user && !authLoading) {
      setUserDataState(null);
      setTransactions([]);
      setLeaderboard([]);
      setUserQuests([]);
      setFaqs([]);
      setLoadingUserData(false);
      setLoadingLeaderboard(false);
      setLoadingQuests(false);
      setLoadingFaqs(false);
    }
  }, [user, authLoading, fetchUserData, fetchTransactions, fetchMarqueeItems, fetchLeaderboardData, processFirestoreData, toast, fetchFaqs, refreshUserQuests]); // Added fetchFaqs and refreshUserQuests

  useEffect(() => {
    if (userData && user) {
      checkAndAwardAchievements();
      checkAndAwardReferralMilestones();
      checkAndCompleteQuests();
    }
  }, [userData, user, checkAndAwardAchievements, checkAndAwardReferralMilestones, checkAndCompleteQuests]);


  const updateEnergy = useCallback((newEnergy: number, lastUpdate: Date) => {
    setUserDataState(prev => {
      if (!prev) return null;
      const effectiveMaxEnergy = prev.maxEnergy * CONFIG.ENERGY_OVERFILL_CAP_MULTIPLIER;
      const cappedNewEnergy = Math.min(newEnergy, effectiveMaxEnergy);
      return { ...prev, currentEnergy: cappedNewEnergy, lastEnergyUpdate: lastUpdate };
    });
  }, [setUserDataState]);

  const setActiveThemeState = useCallback((themeId: string) => {
    if (!user || !userData) return;
    if (userData.unlockedThemes?.includes(themeId)) {
      updateUserFirestoreData({ activeTheme: themeId });
    } else {
      toast({ title: "Theme Locked", description: "Unlock this theme first.", variant: "destructive" });
    }
  }, [user, userData, updateUserFirestoreData, toast]);

  const purchaseTheme = useCallback(async (themeId: string): Promise<boolean> => {
    if (!user || !userData) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return false;
    }
    const theme = CONFIG.APP_THEMES.find(t => t.id === themeId);
    if (!theme) {
      toast({ title: "Error", description: "Theme not found.", variant: "destructive" });
      return false;
    }
    if (userData.unlockedThemes?.includes(themeId)) {
      toast({ title: "Already Unlocked", description: "You already own this theme.", variant: "default" });
      setActiveThemeState(themeId);
      return true;
    }
    if (userData.balance < theme.cost) {
      toast({ title: "Insufficient Funds", description: `You need ${theme.cost} ${CONFIG.COIN_SYMBOL} for this theme.`, variant: "destructive" });
      return false;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      const newUnlockedThemes = [...(userData.unlockedThemes || []), themeId];
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User doc missing";
        const currentBalance = userDoc.data()?.balance || 0;
        if (currentBalance < theme.cost) throw "Insufficient funds on server";

        transaction.update(userRef, {
          balance: increment(-theme.cost),
          unlockedThemes: newUnlockedThemes,
          activeTheme: themeId,
        });
      });

      await addTransaction({
        amount: theme.cost,
        type: 'theme_purchase',
        status: 'completed',
        details: `Purchased ${theme.name} theme`,
      });

      toast({ title: "Theme Unlocked!", description: `${theme.name} unlocked and applied.`, variant: "default" });
      // Local state updates via snapshot listener
      return true;
    } catch (error: any) {
      console.error("Error purchasing theme:", error);
      toast({ title: "Error", description: error.message || "Failed to purchase theme.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast, setActiveThemeState, addTransaction]);

  const purchaseBooster = useCallback(async (boosterId: string) => {
    if (!user || !userData) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    const booster = CONFIG.BOOSTERS.find(b => b.id === boosterId);
    if (!booster) {
      toast({ title: "Error", description: "Booster not found.", variant: "destructive" });
      return;
    }

    const currentLevel = userData.boostLevels[booster.id] || 0;
    if (currentLevel >= booster.maxLevel) {
      toast({ title: "Max Level", description: "This booster is already at max level.", variant: "default" });
      return;
    }

    const cost = Math.round(booster.cost * Math.pow(1.5, currentLevel));
    if (userData.balance < cost) {
      toast({ title: "Insufficient Funds", description: `You need ${cost} ${CONFIG.COIN_SYMBOL} to buy this.`, variant: "destructive" });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      await runTransaction(db, async (firestoreTransaction) => {
        const userDoc = await firestoreTransaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");

        const serverBalance = userDoc.data()?.balance || 0;
        if (serverBalance < cost) throw new Error("Insufficient funds on server.");

        const updates: Partial<UserData> & { [key: string]: any } = {
          balance: increment(-cost),
          [`boostLevels.${booster.id}`]: increment(1),
        };

        if (booster.effect_type === 'tap_power') {
          updates.tapPower = increment(booster.value);
        } else if (booster.effect_type === 'max_energy') {
          updates.maxEnergy = increment(booster.value);
          const currentEnergy = userDoc.data()?.currentEnergy || 0;
          const currentMaxEnergy = userDoc.data()?.maxEnergy || CONFIG.INITIAL_MAX_ENERGY;
          const newMaxEnergy = currentMaxEnergy + booster.value;
          updates.currentEnergy = Math.min(currentEnergy + booster.value, newMaxEnergy * CONFIG.ENERGY_OVERFILL_CAP_MULTIPLIER);
        }
        firestoreTransaction.update(userRef, updates);
      });

      await addTransaction({
        amount: cost,
        type: 'booster_purchase',
        status: 'completed',
        details: `${booster.name} Lvl ${currentLevel + 1}`,
      });
      toast({ title: "Success", description: `${booster.name} upgraded!`, variant: "default" });
      await checkAndCompleteQuests('booster_purchase_specific', booster.id, 1);
    } catch (error: any) {
      console.error("Error purchasing booster:", error);
      toast({ title: "Error", description: error.message || "Failed to purchase booster.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast, checkAndCompleteQuests]);

  const claimDailyBonus = useCallback(async () => {
    if (!user || !userData) return;
    const today = new Date().toDateString();
    const lastClaimDate = userData.lastLoginBonusClaimed ? new Date(userData.lastLoginBonusClaimed).toDateString() : null;

    if (lastClaimDate === today) {
      toast({ title: "Already Claimed", description: "Daily bonus already claimed for today.", variant: "default" });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        balance: increment(CONFIG.DAILY_LOGIN_BONUS),
        lastLoginBonusClaimed: serverTimestamp(),
      });
      await addTransaction({
        amount: CONFIG.DAILY_LOGIN_BONUS,
        type: 'daily_bonus',
        status: 'completed',
      });
      toast({ title: "Bonus Claimed!", description: `You received ${CONFIG.DAILY_LOGIN_BONUS} ${CONFIG.COIN_SYMBOL}.`, variant: "default" });
    } catch (error) {
      console.error("Error claiming daily bonus:", error);
      toast({ title: "Error", description: "Failed to claim daily bonus.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast]);

  const submitRedeemRequest = useCallback(async (amount: number, paymentMethod: string, paymentDetails: any) => {
    if (!user || !userData) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (userData.balance < amount) {
      toast({ title: "Error", description: "Insufficient balance.", variant: "destructive" });
      return;
    }
    if (amount < CONFIG.MIN_REDEEM) {
      toast({ title: "Error", description: `Minimum redeem amount is ${CONFIG.MIN_REDEEM} ${CONFIG.COIN_SYMBOL}.`, variant: "destructive" });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      await runTransaction(db, async (firestoreTransaction) => {
        const userDoc = await firestoreTransaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");
        const serverBalance = userDoc.data()?.balance || 0;
        if (serverBalance < amount) throw new Error("Insufficient funds on server.");
        firestoreTransaction.update(userRef, { balance: increment(-amount) });
      });

      await addTransaction({
        amount,
        type: 'redeem',
        status: 'pending',
        paymentMethod,
        paymentDetails,
        inrAmount: amount * CONFIG.CONVERSION_RATE,
      });
      toast({ title: "Request Submitted", description: "Your redeem request has been submitted.", variant: "default" });
    } catch (error: any) {
      console.error("Error submitting redeem request:", error);
      toast({ title: "Error", description: error.message || "Failed to submit redeem request.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast]);

  const resetUserProgress = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.id);
      const now = new Date();
      const defaultRawData: UserData = {
        balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(),
        currentEnergy: CONFIG.INITIAL_MAX_ENERGY,
        maxEnergy: CONFIG.INITIAL_MAX_ENERGY, tapPower: CONFIG.INITIAL_TAP_POWER,
        lastEnergyUpdate: now, boostLevels: {}, lastLoginBonusClaimed: null,
        createdAt: userData?.createdAt || now,
        photoURL: null,
        referredBy: userData?.referredBy || null,
        name: userData?.name || user.name || 'User',
        email: userData?.email || user.email || '',
        completedAchievements: {}, referralsMadeCount: 0,
        activeTheme: CONFIG.APP_THEMES[0].id, unlockedThemes: [CONFIG.APP_THEMES[0].id],
        frenzyEndTime: null, frenzyMultiplier: null, energySurgeEndTime: null,
      };

      await setDoc(userDocRef, {
        ...defaultRawData,
        lastEnergyUpdate: Timestamp.fromDate(defaultRawData.lastEnergyUpdate as Date),
        lastLoginBonusClaimed: defaultRawData.lastLoginBonusClaimed ? Timestamp.fromDate(defaultRawData.lastLoginBonusClaimed as Date) : null,
        createdAt: Timestamp.fromDate(defaultRawData.createdAt as Date),
        updatedAt: serverTimestamp()
      });

      const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const batch = writeBatch(db);
      transactionsSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));

      const userQuestsRef = doc(db, 'user_quests', user.id);
      const dailyQuestsCollectionRef = collection(db, `user_quests/${user.id}/daily_quests`);
      const dailyQuestsSnapshot = await getDocs(dailyQuestsCollectionRef);
      dailyQuestsSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      batch.delete(userQuestsRef);

      await batch.commit();

      setTransactions([]);
      setUserQuests([]);
      toast({ title: "Progress Reset", description: "Your account progress has been reset.", variant: "default" });
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({ title: "Error", description: "Failed to reset progress.", variant: "destructive" });
    }
  }, [user, userData, toast]);

  const uploadProfilePicture = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to upload a photo.', variant: 'destructive' });
      return null;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image size cannot exceed 2MB.', variant: 'destructive' });
      return null;
    }

    const filePath = `profilePictures/${user.id}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
      const uploadTask = uploadBytesResumable(fileRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => { },
          (error) => {
            console.error('Upload failed:', error);
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
            reject(null);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              if (userData?.photoURL) {
                try {
                  const oldFileRef = storageRef(storage, userData.photoURL);
                  await deleteObject(oldFileRef);
                } catch (deleteError: any) {
                  if (deleteError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old profile picture:", deleteError);
                  }
                }
              }
              const userDocRef = doc(db, 'users', user.id);
              await updateDoc(userDocRef, { photoURL: downloadURL });
              // Local state updates via snapshot
              toast({ title: 'Success', description: 'Profile picture updated!' });
              resolve(downloadURL);
            } catch (error: any) {
              console.error("Error updating Firestore or getting URL:", error);
              toast({ title: 'Error', description: 'Failed to save profile picture URL.', variant: 'destructive' });
              reject(null);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error starting upload:", error);
      toast({ title: 'Upload Error', description: 'Could not start image upload.', variant: 'destructive' });
      return null;
    }
  }, [user, userData, toast]);

  const transferToUser = useCallback(async (recipientId: string, amount: number, recipientName?: string): Promise<boolean> => {
    if (!user || !userData) {
      toast({ title: "Error", description: "You must be logged in to transfer.", variant: "destructive" });
      return false;
    }
    if (recipientId === user.id) {
      toast({ title: "Invalid Transfer", description: "You cannot send coins to yourself.", variant: "destructive" });
      return false;
    }
    if (amount <= 0) {
      toast({ title: "Invalid Amount", description: "Transfer amount must be positive.", variant: "destructive" });
      return false;
    }
    if (userData.balance < amount) {
      toast({ title: "Insufficient Balance", description: `You don't have enough ${CONFIG.COIN_SYMBOL} to send.`, variant: "destructive" });
      return false;
    }

    const senderRef = doc(db, 'users', user.id);
    const recipientRef = doc(db, 'users', recipientId);

    try {
      await runTransaction(db, async (firestoreTransaction) => {
        const senderDoc = await firestoreTransaction.get(senderRef);
        const recipientDoc = await firestoreTransaction.get(recipientRef);

        if (!senderDoc.exists()) {
          throw new Error("Sender document does not exist. Please re-login.");
        }
        if (!recipientDoc.exists()) {
          throw new Error(`Recipient with ID "${recipientId}" not found.`);
        }

        const senderData = senderDoc.data() as UserData;
        if (senderData.balance < amount) {
          throw new Error(`Insufficient balance. Current: ${senderData.balance}, trying to send: ${amount}`);
        }

        firestoreTransaction.update(senderRef, { balance: increment(-amount) });
        firestoreTransaction.update(recipientRef, { balance: increment(amount) });

        const senderTxRef = doc(collection(db, 'transactions'));
        firestoreTransaction.set(senderTxRef, {
          userId: user.id,
          userName: userData.name || user.name,
          amount: amount,
          type: 'p2p_send',
          status: 'completed',
          date: serverTimestamp(),
          details: `Sent to ${recipientName || recipientId}`,
          relatedUserId: recipientId,
          relatedUserName: recipientName || (recipientDoc.data() as UserData).name || 'Unknown User',
        });

        const recipientTxRef = doc(collection(db, 'transactions'));
        firestoreTransaction.set(recipientTxRef, {
          userId: recipientId,
          userName: recipientName || (recipientDoc.data() as UserData).name || 'Unknown User',
          amount: amount,
          type: 'p2p_receive',
          status: 'completed',
          date: serverTimestamp(),
          details: `Received from ${userData.name || user.name}`,
          relatedUserId: user.id,
          relatedUserName: userData.name || user.name,
        });
      });

      toast({ title: "Transfer Successful!", description: `${formatNumber(amount)} ${CONFIG.COIN_SYMBOL} sent to ${recipientName || recipientId}.`, variant: "default" });
      // Local state updates via snapshot
      return true;
    } catch (error: any) {
      console.error("Error during P2P transfer:", error);
      toast({ title: "Transfer Failed", description: error.message || "Could not complete the transfer.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast]);


  const refreshUserQuests = useCallback(async () => {
    if (!user) return;
    setLoadingQuests(true);

    const userQuestsRef = doc(db, 'user_quests', user.id);
    const userQuestsSnap = await getDoc(userQuestsRef);
    const today = new Date();
    let lastRefreshDate: Date | null = null;

    if (userQuestsSnap.exists()) {
      lastRefreshDate = (userQuestsSnap.data().lastQuestRefresh as Timestamp)?.toDate();
    }

    // Check if quests need refreshing (daily reset)
    if (!lastRefreshDate || lastRefreshDate.toDateString() !== today.toDateString()) {
      const batch = writeBatch(db);
      const oldDailyQuestsCollectionRef = collection(db, `user_quests/${user.id}/daily_quests`);
      const oldDailyQuestsSnapshot = await getDocs(oldDailyQuestsCollectionRef);
      oldDailyQuestsSnapshot.forEach(docSnap => batch.delete(docSnap.ref));

      const availableQuests = CONFIG.QUESTS.filter(q => q.type === 'daily');
      const shuffledQuests = [...availableQuests].sort(() => 0.5 - Math.random());
      const newActiveQuestDefinitions = shuffledQuests.slice(0, CONFIG.MAX_DAILY_QUESTS_ASSIGNED);
      const newActiveQuestIds = newActiveQuestDefinitions.map(q => q.id);

      batch.set(userQuestsRef, { lastQuestRefresh: serverTimestamp(), activeDailyQuestIds: newActiveQuestIds }, { merge: true });

      const newQuestsForState: UserQuest[] = [];
      for (const questDef of newActiveQuestDefinitions) {
        const newQuestDocRef = doc(db, `user_quests/${user.id}/daily_quests`, questDef.id);
        const questData: Omit<UserQuest, 'id'> = {
          definition: questDef,
          progress: 0,
          completed: false,
          claimed: false,
          assignedAt: serverTimestamp() as Timestamp,
        };
        batch.set(newQuestDocRef, questData);
        newQuestsForState.push({ id: questDef.id, ...questData, assignedAt: today });
      }
      await batch.commit();
      setUserQuests(newQuestsForState);
    } else if (userQuestsSnap.exists()){
      // Quests already set for today, just fetch them
      const activeQuestIds = userQuestsSnap.data().activeDailyQuestIds || [];
      const fetchedQuests: UserQuest[] = [];
      for (const questId of activeQuestIds) {
        const questDetailRef = doc(db, `user_quests/${user.id}/daily_quests`, questId);
        const questDetailSnap = await getDoc(questDetailRef);
        if (questDetailSnap.exists()) {
          fetchedQuests.push({ id: questId, ...questDetailSnap.data() } as UserQuest);
        }
      }
      setUserQuests(fetchedQuests);
    }
    setLoadingQuests(false);
  }, [user]);

  const updateQuestProgress = useCallback(async (questId: string, progressIncrement: number) => {
    if (!user || !userQuests.find(q => q.id === questId && !q.completed)) return;

    const questRef = doc(db, `user_quests/${user.id}/daily_quests`, questId);
    try {
      await updateDoc(questRef, { progress: increment(progressIncrement) });
      // Local state will update via snapshot listener or checkAndCompleteQuests
    } catch (error) {
      console.error(`Error updating progress for quest ${questId}:`, error);
    }
  }, [user, userQuests]);

  const checkAndCompleteQuests = useCallback(async (
    eventType?: QuestDefinition['criteria']['type'],
    eventDetail?: string | number, // e.g., boosterId, pageName, or value for balance_increase
    eventIncrement?: number // e.g., number of taps, amount of balance increase
  ) => {
    if (!user || !userData || userQuests.length === 0) return;

    let questsUpdated = false;
    for (const quest of userQuests) {
      if (quest.completed) continue;

      let progressMadeThisCheck = 0;
      let criteriaMetNow = false;

      const { type, value, page } = quest.definition.criteria;

      if (eventType === type) {
        switch (type) {
          case 'tap_count_total_session': // This would be taps since quest assigned or app opened.
            if (eventIncrement) progressMadeThisCheck = eventIncrement;
            break;
          case 'balance_increase_session': // More complex, need initial balance at quest assignment. Simpler: check current balance if that's the goal.
                                           // For now, let's assume it's 'reach_balance_value'
            if (userData.balance >= value) criteriaMetNow = true; // Simplified for this example.
            break;
          case 'visit_page':
            if (eventDetail === page) progressMadeThisCheck = 1; // Mark as 1 visit
            break;
          case 'interact_ad': // Needs specific ad interaction tracking
            if (eventIncrement) progressMadeThisCheck = eventIncrement;
            break;
          case 'booster_purchase_specific':
            if (eventDetail === quest.definition.criteria.boosterId || quest.definition.criteria.boosterId === 'any') {
              progressMadeThisCheck = 1;
            }
            break;
        }
      }

      if (progressMadeThisCheck > 0) {
        const newProgress = (quest.progress || 0) + progressMadeThisCheck;
        if (newProgress >= quest.definition.criteria.value) {
          criteriaMetNow = true;
        }
        if (!criteriaMetNow) { // Only update progress if not yet met via this check
           await updateQuestProgress(quest.id, progressMadeThisCheck);
           questsUpdated = true;
        }
      }
      
      // Check if overall criteria met now (e.g. total taps for day, current balance)
      // This covers cases where progress isn't incremental from an event, but based on current state.
      if (!criteriaMetNow) {
        switch (type) {
            case 'tap_count_total_session': // This should actually reflect total taps today from userData
                if (userData.tapCountToday >= value && (quest.progress || 0) < value) {
                    await updateDoc(doc(db, `user_quests/${user.id}/daily_quests`, quest.id), { progress: userData.tapCountToday});
                    if(userData.tapCountToday >= value) criteriaMetNow = true;
                }
                break;
            // Other non-incremental checks can be added here.
        }
      }


      if (criteriaMetNow && !quest.completed) {
        const questRef = doc(db, `user_quests/${user.id}/daily_quests`, quest.id);
        await updateDoc(questRef, { completed: true, progress: quest.definition.criteria.value });
        toast({ title: "Quest Complete!", description: `You've completed: ${quest.definition.name}`, variant: "default" });
        questsUpdated = true;
      }
    }
    if(questsUpdated){
        // Snapshot listener should update local state
    }

  }, [user, userData, userQuests, toast, updateQuestProgress]);


  const claimQuestReward = useCallback(async (questId: string) => {
    if (!user || !userData) return;
    const quest = userQuests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) {
      toast({ title: "Cannot Claim", description: "Quest not completed or reward already claimed.", variant: "destructive" });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      const questRef = doc(db, `user_quests/${user.id}/daily_quests`, questId);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const questDoc = await transaction.get(questRef);
        if (!userDoc.exists() || !questDoc.exists()) throw "Document missing";

        const questData = questDoc.data() as UserQuest;
        if (!questData.completed || questData.claimed) throw "Quest state error";

        transaction.update(userRef, { balance: increment(quest.definition.reward) });
        transaction.update(questRef, { claimed: true });
      });

      await addTransaction({
        amount: quest.definition.reward,
        type: 'quest_reward',
        status: 'completed',
        details: `Reward for: ${quest.definition.name}`,
      });
      toast({ title: "Reward Claimed!", description: `You received ${quest.definition.reward} ${CONFIG.COIN_SYMBOL} for ${quest.definition.name}!`, variant: "default" });
      // Local state updates via snapshot listener
    } catch (error: any) {
      console.error("Error claiming quest reward:", error);
      toast({ title: "Claim Error", description: error.message || "Failed to claim quest reward.", variant: "destructive" });
    }
  }, [user, userData, userQuests, addTransaction, toast]);


  const fetchFaqs = useCallback(async () => {
    setLoadingFaqs(true);
    try {
      const faqsCollectionRef = collection(db, 'faqs');
      const q = query(faqsCollectionRef, orderBy('category'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      const fetchedFaqs = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FAQEntry));

      if (fetchedFaqs.length === 0 && CONFIG.DEFAULT_FAQS.length > 0) {
        // Populate with default FAQs if collection is empty
        const batch = writeBatch(db);
        CONFIG.DEFAULT_FAQS.forEach(faqData => {
          const newFaqRef = doc(collection(db, 'faqs'));
          batch.set(newFaqRef, faqData);
        });
        await batch.commit();
        // Re-fetch after populating
        const populatedSnapshot = await getDocs(q);
        const populatedFaqs = populatedSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FAQEntry));
        setFaqs(populatedFaqs);
      } else {
        setFaqs(fetchedFaqs);
      }

    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast({ title: "Error", description: "Could not load FAQs.", variant: "destructive" });
    } finally {
      setLoadingFaqs(false);
    }
  }, [toast]);

  const submitSupportTicket = useCallback(async (category: string, description: string): Promise<boolean> => {
    if (!user || !userData) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return false;
    }
    if (!category || !description.trim()) {
      toast({ title: "Error", description: "Please select a category and provide a description.", variant: "destructive" });
      return false;
    }

    try {
      const newTicketRef = doc(collection(db, 'support_tickets'));
      const ticketData: Omit<SupportTicket, 'id'> = {
        userId: user.id,
        userName: userData.name || user.name || 'N/A',
        userEmail: userData.email || user.email || 'N/A',
        category,
        description,
        status: 'open',
        createdAt: serverTimestamp() as Timestamp,
      };
      await setDoc(newTicketRef, ticketData);
      toast({ title: "Ticket Submitted", description: "Your support ticket has been submitted. We'll get back to you soon.", variant: "default" });
      return true;
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({ title: "Submission Error", description: "Could not submit your support ticket.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast]);

  const getAndSetPersonalizedTip = useCallback(async () => {
    if (!user || !userData) return;

    const now = Date.now();
    if (now - lastTipFetchTimeRef.current < CONFIG.AI_TIP_COOLDOWN_MINUTES * 60 * 1000) {
      return; // Cooldown active
    }
    if (Math.random() > CONFIG.AI_TIP_FETCH_PROBABILITY) {
      return; // Skip by probability
    }

    lastTipFetchTimeRef.current = now;

    const input: PersonalizedTipInput = {
      userId: user.id,
      currentBalance: userData.balance,
      tapCountToday: userData.tapCountToday,
      maxEnergy: userData.maxEnergy,
      tapPower: userData.tapPower,
      activeBoosters: Object.entries(userData.boostLevels || {})
        .filter(([, level]) => level > 0)
        .map(([id, level]) => ({ id, level } as { id: string, level: number })),
      recentPageVisits: pageHistory.slice(-5), // Last 5 page visits
      completedAchievementsCount: Object.keys(userData.completedAchievements || {}).length,
      activeTheme: CONFIG.APP_THEMES.find(t => t.id === userData.activeTheme)?.name || 'Default',
    };

    try {
      const result = await getPersonalizedTip(input);
      if ('tip' in result && result.tip) {
        setCurrentPersonalizedTip(result.tip);
      } else if ('error' in result) {
        console.warn("Error fetching personalized tip:", result.error);
        setCurrentPersonalizedTip(null); // Clear previous tip on error
      }
    } catch (e) {
      console.error("Failed to fetch personalized tip action:", e);
      setCurrentPersonalizedTip(null);
    }
  }, [user, userData, pageHistory]);

  const triggerTapFrenzy = useCallback(async () => {
    if (!user || !userData) return;
    const frenzyEndTime = new Date(Date.now() + CONFIG.TAP_FRENZY_DURATION_SECONDS * 1000);
    await updateUserFirestoreData({
      frenzyEndTime: Timestamp.fromDate(frenzyEndTime),
      frenzyMultiplier: CONFIG.TAP_FRENZY_MULTIPLIER,
      energySurgeEndTime: null, // End any active energy surge
    });
    toast({ title: "TAP FRENZY!", description: `Tap power x${CONFIG.TAP_FRENZY_MULTIPLIER} for ${CONFIG.TAP_FRENZY_DURATION_SECONDS} seconds!`, duration: 3000 });
  }, [user, userData, updateUserFirestoreData, toast]);

  const triggerEnergySurge = useCallback(async () => {
    if (!user || !userData) return;
    const surgeEndTime = new Date(Date.now() + CONFIG.ENERGY_SURGE_DURATION_SECONDS * 1000);
    await updateUserFirestoreData({
      energySurgeEndTime: Timestamp.fromDate(surgeEndTime),
      frenzyEndTime: null, // End any active frenzy
      frenzyMultiplier: null,
    });
    toast({ title: "ENERGY SURGE!", description: `Taps cost 0 energy for ${CONFIG.ENERGY_SURGE_DURATION_SECONDS} seconds!`, duration: 3000 });
  }, [user, userData, updateUserFirestoreData, toast]);

  return (
    <AppStateContext.Provider value={{
      userData, transactions, marqueeItems, leaderboard, achievements, userQuests, faqs,
      loadingUserData, loadingLeaderboard, loadingAchievements, loadingQuests, loadingFaqs,
      setUserDataState, fetchUserData, updateUserFirestoreData, addTransaction,
      updateEnergy, purchaseBooster, claimDailyBonus, submitRedeemRequest,
      resetUserProgress, isOnline, pageHistory, addPageVisit,
      fetchLeaderboardData, checkAndAwardAchievements, purchaseTheme, setActiveThemeState,
      uploadProfilePicture, transferToUser,
      refreshUserQuests, claimQuestReward, updateQuestProgress,
      submitSupportTicket, fetchFaqs,
      currentPersonalizedTip, getAndSetPersonalizedTip,
      triggerTapFrenzy, triggerEnergySurge,
      showOfflineEarningsModal, offlineEarnedAmount, closeOfflineEarningsModal,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

