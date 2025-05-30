
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { db, storage } from '@/lib/firebase'; // Import storage
import { doc, getDoc, onSnapshot, Timestamp, setDoc, updateDoc, collection, query, where, orderBy, getDocs, runTransaction, writeBatch, serverTimestamp, increment, DocumentData, FirestoreError, limit } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"; // Firebase storage imports
import type { UserData, Transaction, MarqueeItem, LeaderboardEntry, Achievement, UserProfile } from '@/types';
import { useAuth } from './auth-provider';
import { CONFIG } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface AppStateContextType {
  userData: UserData | null;
  transactions: Transaction[];
  marqueeItems: MarqueeItem[];
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  loadingUserData: boolean;
  loadingLeaderboard: boolean;
  loadingAchievements: boolean;
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
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({text})));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements] = useState<Achievement[]>(CONFIG.ACHIEVEMENTS);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const addPageVisit = useCallback((page: string) => {
    setPageHistory(prev => [...prev, page].slice(-10));
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        toast({ title: "Offline", description: "You are currently offline. Some features may be limited.", variant: "destructive" });
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
    let processedLastTapDate: string;
    const rawLTDate = data.lastTapDate;
    if (rawLTDate instanceof Timestamp) {
      processedLastTapDate = rawLTDate.toDate().toDateString();
    } else if (rawLTDate instanceof Date) {
      processedLastTapDate = rawLTDate.toDateString();
    } else if (typeof rawLTDate === 'string') {
      const d = new Date(rawLTDate);
      processedLastTapDate = !isNaN(d.getTime()) ? d.toDateString() : new Date().toDateString();
    } else {
      processedLastTapDate = new Date().toDateString();
    }

    let processedLastEnergyUpdate: Date;
    const rawLEUpdate = data.lastEnergyUpdate;
    if (rawLEUpdate instanceof Timestamp) {
      processedLastEnergyUpdate = rawLEUpdate.toDate();
    } else if (rawLEUpdate instanceof Date) {
      processedLastEnergyUpdate = rawLEUpdate;
    } else if (typeof rawLEUpdate === 'string') {
        const d = new Date(rawLEUpdate);
        processedLastEnergyUpdate = !isNaN(d.getTime()) ? d : new Date();
    } else {
      processedLastEnergyUpdate = new Date();
    }

    let processedLastLoginBonusClaimed: Date | null;
    const rawLLBC = data.lastLoginBonusClaimed;
    if (rawLLBC instanceof Timestamp) {
      processedLastLoginBonusClaimed = rawLLBC.toDate();
    } else if (rawLLBC instanceof Date) {
      processedLastLoginBonusClaimed = rawLLBC;
    } else if (typeof rawLLBC === 'string') {
        const d = new Date(rawLLBC);
        processedLastLoginBonusClaimed = !isNaN(d.getTime()) ? d : null;
    } else {
      processedLastLoginBonusClaimed = null;
    }

    let processedCreatedAt: Date;
    const rawCreatedAt = data.createdAt;
    if (rawCreatedAt instanceof Timestamp) {
      processedCreatedAt = rawCreatedAt.toDate();
    } else if (rawCreatedAt instanceof Date) {
      processedCreatedAt = rawCreatedAt;
    } else if (typeof rawCreatedAt === 'string') {
        const d = new Date(rawCreatedAt);
        processedCreatedAt = !isNaN(d.getTime()) ? d : new Date(currentAuthUser?.joinDate || Date.now());
    } else {
      processedCreatedAt = new Date(currentAuthUser?.joinDate || Date.now());
    }

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
      lastTapDate: processedLastTapDate,
      lastEnergyUpdate: processedLastEnergyUpdate,
      lastLoginBonusClaimed: processedLastLoginBonusClaimed,
      createdAt: processedCreatedAt,
      completedAchievements: data.completedAchievements ?? {},
      referralsMadeCount: data.referralsMadeCount ?? 0,
      activeTheme: data.activeTheme ?? CONFIG.APP_THEMES[0].id,
      unlockedThemes: data.unlockedThemes ?? [CONFIG.APP_THEMES[0].id],
    };
  }, []);


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
      
      setTransactions(prev => [{...transactionData, id: newTransactionRef.id, userId: user.id, date: new Date()} as Transaction, ...prev].sort((a,b) => (((b.date as any) || 0) instanceof Timestamp ? (b.date as Timestamp).toMillis() : new Date(b.date as any || 0).getTime()) - (((a.date as any) || 0) instanceof Timestamp ? (a.date as Timestamp).toMillis() : new Date(a.date as any || 0).getTime())));
      toast({ title: "Success", description: `${String(transactionData.type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} recorded.`, variant: "default" });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Failed to record transaction.", variant: "destructive" });
    }
  }, [user, toast]);

  const checkAndAwardAchievements = useCallback(async () => {
    if (!userData || !user) return; 
    setLoadingAchievements(true);
    const currentCompletedAchievements = userData.completedAchievements || {};

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
           setUserDataState(prev => prev ? ({ 
             ...prev,
             balance: prev.balance + achievement.reward,
             completedAchievements: { ...prev.completedAchievements, [achievement.id]: Timestamp.now() }
           }) : null);

        } catch (error) {
          console.error("Error awarding achievement transaction:", error);
        }
      }
    }
    setLoadingAchievements(false);
  }, [userData, user, addTransaction, toast, setUserDataState]); 

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
      } else {
        const now = new Date();
        const newUser: UserData = {
          balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(),
          currentEnergy: CONFIG.INITIAL_MAX_ENERGY, maxEnergy: CONFIG.INITIAL_MAX_ENERGY,
          tapPower: CONFIG.INITIAL_TAP_POWER, lastEnergyUpdate: now, boostLevels: {},
          lastLoginBonusClaimed: null, referredBy: null,
          createdAt: new Date(user.joinDate || Date.now()),
          name: user.name || 'New User', email: user.email || '',
          photoURL: null,
          completedAchievements: {}, referralsMadeCount: 0,
          activeTheme: CONFIG.APP_THEMES[0].id, unlockedThemes: [CONFIG.APP_THEMES[0].id],
        };
        await setDoc(userDocRef, {
          ...newUser,
          lastTapDate: Timestamp.fromDate(new Date(newUser.lastTapDate!)),
          lastEnergyUpdate: Timestamp.fromDate(newUser.lastEnergyUpdate as Date),
          lastLoginBonusClaimed: newUser.lastLoginBonusClaimed ? Timestamp.fromDate(newUser.lastLoginBonusClaimed as Date) : null,
          createdAt: Timestamp.fromDate(newUser.createdAt as Date),
        });
        setUserDataState(newUser);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({ title: "Error", description: "Could not load your data.", variant: "destructive" });
    } finally {
      setLoadingUserData(false);
    }
  }, [user, firebaseUser, toast, processFirestoreData, setUserDataState]);


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
      if (dataToUpdate.lastTapDate && typeof dataToUpdate.lastTapDate === 'string') {
        const dateObj = new Date(dataToUpdate.lastTapDate);
        if (!isNaN(dateObj.getTime())) {
            firestoreReadyData.lastTapDate = Timestamp.fromDate(dateObj);
        } else {
            delete firestoreReadyData.lastTapDate; 
        }
      }
      await updateDoc(userDocRef, firestoreReadyData);
    } catch (error) {
      console.error("Error updating user data:", error);
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    }
  }, [user, toast]);


  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }
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
          transactionDate = new Date(); 
        }
        return {
          id: docSnap.id,
          ...data,
          date: transactionDate,
        } as Transaction;
      });
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [user]);
  
  const fetchLeaderboardData = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      // Firestore index: users collection, field 'balance', order 'descending'
      // Firestore security rules for users collection: allow list: if request.auth != null;
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


  // Effect for initial data loading and setting up listeners
  useEffect(() => {
    if (user && !authLoading) {
      fetchUserData();
      fetchTransactions();
      fetchMarqueeItems();
      fetchLeaderboardData();

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

      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
      };

    } else if (!user && !authLoading) {
      setUserDataState(null);
      setTransactions([]);
      setLeaderboard([]);
      setLoadingUserData(false);
      setLoadingLeaderboard(false);
    }
  }, [user, authLoading, fetchUserData, fetchTransactions, fetchMarqueeItems, fetchLeaderboardData, processFirestoreData, toast]);
  
  useEffect(() => {
    if (userData && user) {
      checkAndAwardAchievements();
    }
  }, [userData, user, checkAndAwardAchievements]);


  const updateEnergy = useCallback((newEnergy: number, lastUpdate: Date) => {
    setUserDataState(prev => prev ? { ...prev, currentEnergy: newEnergy, lastEnergyUpdate: lastUpdate } : null);
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
      await updateDoc(userRef, {
        balance: increment(-theme.cost),
        unlockedThemes: newUnlockedThemes,
        activeTheme: themeId,
      });

      setUserDataState(prev => prev ? ({
        ...prev,
        balance: prev.balance - theme.cost,
        unlockedThemes: newUnlockedThemes,
        activeTheme: themeId,
      }) : null);
      toast({ title: "Theme Unlocked!", description: `${theme.name} unlocked and applied.`, variant: "default"});
      return true;
    } catch (error) {
      console.error("Error purchasing theme:", error);
      toast({ title: "Error", description: "Failed to purchase theme.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast, setActiveThemeState, setUserDataState]); 

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
          const currentMaxEnergy = userDoc.data()?.maxEnergy || CONFIG.INITIAL_MAX_ENERGY;
          updates.currentEnergy = currentMaxEnergy + booster.value; 
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
    } catch (error: any) {
      console.error("Error purchasing booster:", error);
      toast({ title: "Error", description: error.message || "Failed to purchase booster.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast]);

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
      };

      await setDoc(userDocRef, {
        ...defaultRawData,
        lastTapDate: Timestamp.fromDate(new Date(defaultRawData.lastTapDate!)), 
        lastEnergyUpdate: Timestamp.fromDate(defaultRawData.lastEnergyUpdate as Date),
        lastLoginBonusClaimed: defaultRawData.lastLoginBonusClaimed ? Timestamp.fromDate(defaultRawData.lastLoginBonusClaimed as Date) : null,
        createdAt: Timestamp.fromDate(defaultRawData.createdAt as Date),
        updatedAt: serverTimestamp()
      });

      const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const batch = writeBatch(db);
      transactionsSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();

      setTransactions([]);
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
          (snapshot) => {},
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
              setUserDataState(prev => prev ? { ...prev, photoURL: downloadURL } : null);
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
  }, [user, userData, toast, setUserDataState]);

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

        // Perform updates
        firestoreTransaction.update(senderRef, { balance: increment(-amount) });
        firestoreTransaction.update(recipientRef, { balance: increment(amount) });

        // Log transactions
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
          relatedUserName: recipientName || 'Unknown User',
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
      // Manually update local balance to reflect the change immediately
      setUserDataState(prev => prev ? { ...prev, balance: prev.balance - amount } : null);
      return true;
    } catch (error: any) {
      console.error("Error during P2P transfer:", error);
      toast({ title: "Transfer Failed", description: error.message || "Could not complete the transfer.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast, setUserDataState]);


  return (
    <AppStateContext.Provider value={{
      userData, transactions, marqueeItems, leaderboard, achievements,
      loadingUserData, loadingLeaderboard, loadingAchievements,
      setUserDataState, fetchUserData, updateUserFirestoreData, addTransaction,
      updateEnergy, purchaseBooster, claimDailyBonus, submitRedeemRequest,
      resetUserProgress, isOnline, pageHistory, addPageVisit,
      fetchLeaderboardData, checkAndAwardAchievements, purchaseTheme, setActiveThemeState,
      uploadProfilePicture, transferToUser
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
