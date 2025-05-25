
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Timestamp, setDoc, updateDoc, collection, query, where, orderBy, getDocs, runTransaction, writeBatch, serverTimestamp, increment, DocumentData } from 'firebase/firestore';
import type { UserData, Transaction, MarqueeItem } from '@/types';
import { useAuth } from './auth-provider';
import { CONFIG } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface AppStateContextType {
  userData: UserData | null;
  transactions: Transaction[];
  marqueeItems: MarqueeItem[];
  loadingUserData: boolean;
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
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({text})));
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const addPageVisit = useCallback((page: string) => {
    setPageHistory(prev => [...prev, page].slice(-10)); // Keep last 10 page visits
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

  const processFirestoreData = (data: DocumentData, currentAuthUser: typeof user): UserData => {
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

    let processedLastEnergyUpdate: Date | null;
    const rawLEUpdate = data.lastEnergyUpdate;
    if (rawLEUpdate && typeof (rawLEUpdate as any).toDate === 'function') {
      processedLastEnergyUpdate = (rawLEUpdate as Timestamp).toDate();
    } else if (rawLEUpdate instanceof Date) {
      processedLastEnergyUpdate = rawLEUpdate;
    } else {
      processedLastEnergyUpdate = new Date(); // Fallback to now if undefined/null from Firestore
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
    
    let processedCreatedAt: Date | null;
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
    };
  };


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
        // Initialize new user data
        const now = new Date();
        const newUser: UserData = {
          balance: 0,
          tapCountToday: 0,
          lastTapDate: now.toDateString(),
          currentEnergy: CONFIG.INITIAL_MAX_ENERGY,
          maxEnergy: CONFIG.INITIAL_MAX_ENERGY,
          tapPower: CONFIG.INITIAL_TAP_POWER,
          lastEnergyUpdate: now,
          boostLevels: {},
          lastLoginBonusClaimed: null,
          referredBy: null, 
          createdAt: new Date(user.joinDate || Date.now()),
          name: user.name || 'New User',
          email: user.email || '',
        };
        // Ensure Timestamps are used for Firestore storage
        await setDoc(userDocRef, {
          ...newUser,
          lastTapDate: Timestamp.fromDate(new Date(newUser.lastTapDate!)), // Store as Timestamp
          lastEnergyUpdate: Timestamp.fromDate(newUser.lastEnergyUpdate as Date),
          lastLoginBonusClaimed: newUser.lastLoginBonusClaimed ? Timestamp.fromDate(newUser.lastLoginBonusClaimed as Date) : null,
          createdAt: Timestamp.fromDate(newUser.createdAt as Date),
        });
        setUserDataState(newUser); // Set local state with JS Dates/strings
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({ title: "Error", description: "Could not load your data.", variant: "destructive" });
    } finally {
      setLoadingUserData(false);
    }
  }, [user, firebaseUser, toast]);

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
        // Ensure we are storing a Timestamp if lastTapDate is provided as a string for update
        const dateObj = new Date(dataToUpdate.lastTapDate);
        if (!isNaN(dateObj.getTime())) {
            firestoreReadyData.lastTapDate = Timestamp.fromDate(dateObj);
        } else {
            // Handle invalid date string if necessary, or remove from update
            delete firestoreReadyData.lastTapDate; 
        }
      }
      // Note: createdAt should generally not be updated after initial creation.

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
      // Optimistic update with a client-side Date object for immediate display
      setTransactions(prev => [{...newTransaction, date: new Date()} as Transaction, ...prev]);
      toast({ title: "Success", description: `${transactionData.type} recorded.`, variant: "default" });
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


  useEffect(() => {
    if (user && !authLoading) {
      fetchUserData();
      fetchTransactions();
      fetchMarqueeItems(); 
      const userDocRef = doc(db, 'users', user.id);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserDataState(processFirestoreData(data, user));
        }
      });
      
      const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.id), orderBy('date', 'desc'));
      const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
         const userTransactions = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                date: (data.date as Timestamp).toDate(), // Convert Timestamp to Date
            } as Transaction;
         });
         setTransactions(userTransactions);
      }, (error) => {
        console.error("Error in transaction snapshot listener:", error);
        toast({ title: "Database Error", description: "Could not listen for transaction updates. Check Firestore indexes if this persists.", variant: "destructive", duration: 10000 });
      });

      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
      };

    } else if (!user && !authLoading) {
      setUserDataState(null);
      setTransactions([]);
      setLoadingUserData(false);
    }
  }, [user, authLoading, fetchUserData, fetchTransactions, fetchMarqueeItems, toast]);

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
        if (!userDoc.exists()) throw "User document does not exist!";
        
        const serverBalance = userDoc.data().balance || 0;
        if (serverBalance < cost) throw "Insufficient funds on server.";

        const updates: Partial<UserData> & { [key: string]: any } = {
          balance: increment(-cost),
          [`boostLevels.${booster.id}`]: increment(1),
        };

        if (booster.effect_type === 'tap_power') {
          updates.tapPower = increment(booster.value);
        } else if (booster.effect_type === 'max_energy') {
          updates.maxEnergy = increment(booster.value);
          updates.currentEnergy = increment(booster.value); 
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
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User document does not exist!";
        const serverBalance = userDoc.data().balance || 0;
        if (serverBalance < amount) throw "Insufficient funds on server.";
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
      // Use the processFirestoreData to get a UserData structure with JS Dates
      const defaultRawData: DocumentData = {
        balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(), // Keep as string for initial object
        currentEnergy: CONFIG.INITIAL_MAX_ENERGY,
        maxEnergy: CONFIG.INITIAL_MAX_ENERGY, tapPower: CONFIG.INITIAL_TAP_POWER,
        lastEnergyUpdate: now, // JS Date
        boostLevels: {}, lastLoginBonusClaimed: null,
        createdAt: userData?.createdAt || now, // JS Date, keep original if available
        referredBy: userData?.referredBy || null,
        name: userData?.name || user.name || 'User',
        email: userData?.email || user.email || '',
      };
      
      // Convert to Firestore Timestamps for saving
      await setDoc(userDocRef, {
        ...defaultRawData, // Spread all, then override dates for Firestore
        lastTapDate: Timestamp.fromDate(new Date(defaultRawData.lastTapDate!)),
        lastEnergyUpdate: Timestamp.fromDate(defaultRawData.lastEnergyUpdate as Date),
        lastLoginBonusClaimed: defaultRawData.lastLoginBonusClaimed ? Timestamp.fromDate(defaultRawData.lastLoginBonusClaimed as Date) : null,
        createdAt: Timestamp.fromDate(defaultRawData.createdAt as Date),
        updatedAt: serverTimestamp()
      });

      const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', user.id));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const batch = writeBatch(db);
      transactionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      setTransactions([]);
      toast({ title: "Progress Reset", description: "Your account progress has been reset.", variant: "default" });
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({ title: "Error", description: "Failed to reset progress.", variant: "destructive" });
    }
  }, [user, userData, toast]);


  return (
    <AppStateContext.Provider value={{ 
      userData, 
      transactions, 
      marqueeItems, 
      loadingUserData, 
      setUserDataState,
      fetchUserData,
      updateUserFirestoreData, 
      addTransaction,
      updateEnergy,
      purchaseBooster,
      claimDailyBonus,
      submitRedeemRequest,
      resetUserProgress,
      isOnline,
      pageHistory,
      addPageVisit
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

