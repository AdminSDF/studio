
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Timestamp, setDoc, updateDoc, collection, query, where, orderBy, getDocs, runTransaction, writeBatch, serverTimestamp, increment, DocumentData, FirestoreError, limit, collectionGroup } from 'firebase/firestore';
import type { UserData, Transaction, MarqueeItem, LeaderboardEntry, Achievement, AppTheme } from '@/types';
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

  const processFirestoreData = useCallback((data: DocumentData, currentAuthUser: typeof user): UserData => {
    let processedLastTapDate: string;
    const rawLTDate = data.lastTapDate;
    if (rawLTDate && typeof (rawLTDate as any).toDate === 'function') { 
      processedLastTapDate = (rawLTDate as Timestamp).toDate().toDateString();
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
    if (rawLEUpdate && typeof (rawLEUpdate as any).toDate === 'function') {
      processedLastEnergyUpdate = (rawLEUpdate as Timestamp).toDate();
    } else if (rawLEUpdate instanceof Date) {
      processedLastEnergyUpdate = rawLEUpdate;
    } else {
      processedLastEnergyUpdate = new Date(); 
    }

    let processedLastLoginBonusClaimed: Date | null;
    const rawLLBC = data.lastLoginBonusClaimed;
    if (rawLLBC && typeof (rawLLBC as any).toDate === 'function') {
      processedLastLoginBonusClaimed = (rawLLBC as Timestamp).toDate();
    } else if (rawLLBC instanceof Date) {
      processedLastLoginBonusClaimed = rawLLBC;
    } else {
      processedLastLoginBonusClaimed = null;
    }
    
    let processedCreatedAt: Date;
    const rawCreatedAt = data.createdAt;
    if (rawCreatedAt && typeof (rawCreatedAt as any).toDate === 'function') {
      processedCreatedAt = (rawCreatedAt as Timestamp).toDate();
    } else if (rawCreatedAt instanceof Date) {
      processedCreatedAt = rawCreatedAt;
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
        setUserDataState(processFirestoreData(data, user));
      } else {
        const now = new Date();
        const newUser: UserData = {
          balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(),
          currentEnergy: CONFIG.INITIAL_MAX_ENERGY, maxEnergy: CONFIG.INITIAL_MAX_ENERGY,
          tapPower: CONFIG.INITIAL_TAP_POWER, lastEnergyUpdate: now, boostLevels: {},
          lastLoginBonusClaimed: null, referredBy: null, 
          createdAt: new Date(user.joinDate || Date.now()),
          name: user.name || 'New User', email: user.email || '',
          completedAchievements: {}, referralsMadeCount: 0,
          activeTheme: CONFIG.APP_THEMES[0].id, unlockedThemes: [CONFIG.APP_THEMES[0].id],
        };
        await setDoc(userDocRef, {
          ...newUser,
          lastTapDate: Timestamp.fromDate(new Date(newUser.lastTapDate!)), // Ensure string date is converted
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
  }, [user, firebaseUser, toast, processFirestoreData]);

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
      // The snapshot listener should update transactions, but for immediate feedback:
      setTransactions(prev => [{...newTransaction, date: new Date()} as Transaction, ...prev].sort((a,b) => (b.date as Date).getTime() - (a.date as Date).getTime()));
      toast({ title: "Success", description: `${transactionData.type.replace(/_/g, ' ')} recorded.`, variant: "default" });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Failed to record transaction.", variant: "destructive" });
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
        return {
          id: docSnap.id,
          ...data,
          date: (data.date as Timestamp).toDate(), // Convert Timestamp to Date
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
      // Log the full error object for better debugging
      console.error("Detailed error fetching leaderboard data:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let description = "Could not load leaderboard. Please try again later.";
      if (error.code === 'failed-precondition') {
        description = "Leaderboard query failed. This usually means a required database index is missing or still building. Please ensure an index exists on the 'users' collection for the 'balance' field (sorted descending). Check Firebase console.";
      } else if (error.code === 'permission-denied') {
        description = "Permission denied when trying to load leaderboard. Please check your Firestore security rules to allow reading the 'users' collection.";
      }
      // Add more specific error messages based on other common error.codes if needed
      
      toast({ title: "Leaderboard Error", description, variant: "destructive", duration: 5000 });
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [toast]);

  const checkAndAwardAchievements = useCallback(async () => {
    if (!userData || !user) return;

    let awardedNew = false;
    for (const achievement of CONFIG.ACHIEVEMENTS) {
      if (userData.completedAchievements && userData.completedAchievements[achievement.id]) {
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
            criteriaMet = Object.keys(userData.boostLevels || {}).length > 0;
          } else {
            criteriaMet = (userData.boostLevels?.[achievement.criteria.boosterId!] || 0) >= achievement.criteria.value;
          }
          break;
      }

      if (criteriaMet) {
        const userRef = doc(db, 'users', user.id);
        try {
          await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User document does not exist!";
            
            const currentCompleted = userDoc.data().completedAchievements || {};
            if (currentCompleted[achievement.id]) return; 

            transaction.update(userRef, {
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
          awardedNew = true;
          toast({ title: "Achievement Unlocked!", description: `You earned ${achievement.reward} ${CONFIG.COIN_SYMBOL} for ${achievement.name}!`, variant: "default" });
          // Local state update for immediate feedback, snapshot will confirm
           setUserDataState(prev => prev ? ({
             ...prev,
             balance: prev.balance + achievement.reward,
             completedAchievements: { ...prev.completedAchievements, [achievement.id]: Timestamp.now() } // Use client-side Timestamp for immediate UI
           }) : null);

        } catch (error) {
          console.error("Error awarding achievement:", error);
        }
      }
    }
    if (awardedNew) {
      // If any achievement was awarded, it might be good to re-fetch user data or rely on snapshot
      // fetchUserData(); // Or let snapshot handle it
    }
  }, [userData, user, addTransaction, toast]);


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
          const newUserData = processFirestoreData(data, user)
          setUserDataState(newUserData);
          if(newUserData) checkAndAwardAchievements(); // Check achievements whenever user data changes
        }
      }, (error: FirestoreError) => {
        console.error("Error in user snapshot listener:", error);
        toast({ title: "Sync Error", description: "Could not sync user data. Try refreshing.", variant: "destructive" });
      });
      
      const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.id), orderBy('date', 'desc'));
      const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
         const userTransactions = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return { id: docSnap.id, ...data, date: (data.date as Timestamp).toDate() } as Transaction;
         });
         setTransactions(userTransactions);
      }, (error: FirestoreError) => {
        console.error("Error in transaction snapshot listener:", error);
        let description = "Could not listen for transaction updates. Please try again later.";
        if (error.code === 'failed-precondition') {
          description = "Transactions require an index: userId (asc), date (desc). Ask admin to create it in Firebase console.";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, fetchUserData, fetchTransactions, fetchMarqueeItems, fetchLeaderboardData, processFirestoreData, checkAndAwardAchievements]); 

  const updateEnergy = useCallback((newEnergy: number, lastUpdate: Date) => {
    setUserDataState(prev => prev ? { ...prev, currentEnergy: newEnergy, lastEnergyUpdate: lastUpdate } : null);
  }, []);

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
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
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
        }
        transaction.update(userRef, updates);
      });

      await addTransaction({
        amount: cost,
        type: 'booster_purchase',
        status: 'completed',
        details: `${booster.name} Lvl ${currentLevel + 1}`,
      });
      toast({ title: "Success", description: `${booster.name} upgraded!`, variant: "default" });
      await checkAndAwardAchievements(); 
    } catch (error: any) {
      console.error("Error purchasing booster:", error);
      toast({ title: "Error", description: error.message || "Failed to purchase booster.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast, checkAndAwardAchievements]);

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
      await checkAndAwardAchievements();
    } catch (error) {
      console.error("Error claiming daily bonus:", error);
      toast({ title: "Error", description: "Failed to claim daily bonus.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast, checkAndAwardAchievements]);

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
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");
        const serverBalance = userDoc.data()?.balance || 0;
        if (serverBalance < amount) throw new Error("Insufficient funds on server.");
        transaction.update(userRef, { balance: increment(-amount) });
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
      await checkAndAwardAchievements();
    } catch (error: any) {
      console.error("Error submitting redeem request:", error);
      toast({ title: "Error", description: error.message || "Failed to submit redeem request.", variant: "destructive" });
    }
  }, [user, userData, addTransaction, toast, checkAndAwardAchievements]);

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
      return true;
    } catch (error) {
      console.error("Error purchasing theme:", error);
      toast({ title: "Error", description: "Failed to purchase theme.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast, setActiveThemeState]); // Added setActiveThemeState to dependencies

  const setActiveThemeState = useCallback((themeId: string) => {
    if (!user || !userData) return;
    if (userData.unlockedThemes?.includes(themeId)) {
      updateUserFirestoreData({ activeTheme: themeId });
      // setUserDataState(prev => prev ? ({ ...prev, activeTheme: themeId }) : null); // Rely on snapshot listener for this
    } else {
      toast({ title: "Theme Locked", description: "Unlock this theme first.", variant: "destructive" });
    }
  }, [user, userData, updateUserFirestoreData, toast]);


  return (
    <AppStateContext.Provider value={{ 
      userData, transactions, marqueeItems, leaderboard, achievements,
      loadingUserData, loadingLeaderboard, loadingAchievements,
      setUserDataState, fetchUserData, updateUserFirestoreData, addTransaction,
      updateEnergy, purchaseBooster, claimDailyBonus, submitRedeemRequest,
      resetUserProgress, isOnline, pageHistory, addPageVisit,
      fetchLeaderboardData, checkAndAwardAchievements, purchaseTheme, setActiveThemeState
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

    