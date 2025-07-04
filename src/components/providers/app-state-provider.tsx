
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import {
  doc, getDoc, onSnapshot, Timestamp, setDoc, updateDoc, collection, query, where, orderBy, getDocs,
  runTransaction, writeBatch, serverTimestamp, increment, DocumentData, FirestoreError, limit, collectionGroup
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import type { UserData, Transaction, MarqueeItem, LeaderboardEntry, UserProfile, QuestDefinition, UserQuest, FAQEntry, SupportTicket } from '@/types';
import { Achievement, AppTheme, PaymentDetails, PaymentMethod, SupportTicketCategory } from '@/types'; // Added missing imports from previous turn
import { useAuth } from './auth-provider';
import { CONFIG, getReferralMilestoneReward } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';
import { PersonalizedTipInput, PersonalizedTipOutput } from '@/types'; // Ensure these are correctly imported from types
import { getPersonalizedTip } from '@/app/actions';

interface AppStateContextType {
  userData: UserData | null;
  transactions: Transaction[];
  marqueeItems: MarqueeItem[];
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  userQuests: UserQuest[];
  faqs: FAQEntry[];
  userSupportTickets: SupportTicket[]; // Added
  loadingUserData: boolean;
  loadingLeaderboard: boolean;
  loadingAchievements: boolean;
  loadingQuests: boolean;
  loadingFaqs: boolean;
  loadingMarquee: boolean;
  loadingUserSupportTickets: boolean; // Added
  setUserDataState: (data: UserData | null) => void;
  fetchUserData: () => Promise<void>;
  updateUserFirestoreData: (data: Partial<UserData>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'date'>) => Promise<void>;
  updateEnergy: (newEnergy: number, lastUpdate: Date) => void;
  purchaseBooster: (boosterId: string) => Promise<void>;
  claimDailyBonus: () => Promise<void>;
  submitRedeemRequest: (amount: number, paymentMethod: PaymentMethod, paymentDetails: PaymentDetails) => Promise<void>;
  resetUserProgress: () => Promise<void>;
  isOnline: boolean;
  pageHistory: string[];
  addPageVisit: (page: string) => void;
  fetchLeaderboardData: () => Promise<void>;
  fetchMarqueeItems: () => Promise<void>;
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
  fetchUserSupportTickets: () => Promise<void>; // Added
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
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements] = useState<Achievement[]>(CONFIG.ACHIEVEMENTS);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [userSupportTickets, setUserSupportTickets] = useState<SupportTicket[]>([]); // Added
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingMarquee, setLoadingMarquee] = useState(true);
  const [loadingUserSupportTickets, setLoadingUserSupportTickets] = useState(true); // Added
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
    setPageHistory(prev => [...prev, page].slice(-10));
    if (page === 'boosters' || page === 'store' || page === 'profile') {
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
      photoStoragePath: data.photoStoragePath ?? null, // Read photoStoragePath
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
      // photoURL and photoStoragePath are handled by uploadProfilePicture if they are part of dataToUpdate from there
      // For other direct updates, ensure they are handled if needed (e.g. setting to null)
      if ('photoURL' in dataToUpdate) firestoreReadyData.photoURL = dataToUpdate.photoURL;
      if ('photoStoragePath' in dataToUpdate) firestoreReadyData.photoStoragePath = dataToUpdate.photoStoragePath;

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
          } else {
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
          photoStoragePath: null, // Initialize photoStoragePath
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
          transactionDate = new Date();
        }
        return { id: docSnap.id, ...data, date: transactionDate } as Transaction;
      });
      setTransactions(userTransactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      let description = "Could not load transaction history.";
       if (error.code === 'failed-precondition') {
        description = "Transactions Error: Firestore index missing. Go to Firebase Console -> Firestore Database -> Indexes, and create a composite index for the 'transactions' collection on fields 'userId' (ascending) AND 'date' (descending).";
      } else if (error.code === 'permission-denied') {
        description = "Transactions: Permission denied. Check Firestore security rules for 'transactions' collection.";
      }
      toast({ title: "Transactions Error", description, variant: "destructive", duration: 7000 });
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
        description = "Leaderboard Error: Firestore index missing. Go to Firebase Console -> Firestore Database -> Indexes, and create a composite index for the 'users' collection on the field 'balance' (descending).";
      } else if (error.code === 'permission-denied') {
        description = "Leaderboard: Permission denied. Check Firestore security rules for the 'users' collection. Authenticated users need read access to this collection for leaderboard functionality.";
      }
      toast({ title: "Leaderboard Error", description, variant: "destructive", duration: 9000 });
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [toast]);
  
  const fetchFaqs = useCallback(async () => {
    setLoadingFaqs(true);
    try {
      const faqsCollectionRef = collection(db, 'faqs');
      const q = query(faqsCollectionRef, orderBy('category'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      let fetchedFaqs = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FAQEntry));

      if (fetchedFaqs.length === 0 && CONFIG.DEFAULT_FAQS.length > 0) {
        console.log("No FAQs found in Firestore, attempting to populate defaults...");
        const batch = writeBatch(db);
        CONFIG.DEFAULT_FAQS.forEach(faqData => {
          const newFaqRef = doc(collection(db, 'faqs'));
          batch.set(newFaqRef, faqData);
        });
        await batch.commit();
        console.log("Default FAQs populated. Re-fetching...");
        const populatedSnapshot = await getDocs(q);
        fetchedFaqs = populatedSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FAQEntry));
      }
      setFaqs(fetchedFaqs);
      if (fetchedFaqs.length === 0) {
        console.warn("FAQ list is empty even after attempting to populate defaults.");
      }
    } catch (error) {
      console.error("Error fetching/populating FAQs:", error);
      toast({ title: "FAQ Error", description: "Could not load FAQs. Please check console for details.", variant: "destructive" });
      setFaqs([]); 
    } finally {
      setLoadingFaqs(false);
    }
  }, [toast]);

  const fetchMarqueeItems = useCallback(async () => {
    setLoadingMarquee(true);
    try {
      const marqueeCollectionRef = collection(db, 'marquee_items');
      const q = query(marqueeCollectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      let fetchedItems = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MarqueeItem));

      if (fetchedItems.length === 0 && CONFIG.DEFAULT_MARQUEE_ITEMS.length > 0) {
        const batch = writeBatch(db);
        CONFIG.DEFAULT_MARQUEE_ITEMS.forEach(itemText => {
          const newItemRef = doc(collection(db, 'marquee_items'));
          batch.set(newItemRef, { text: itemText.text, createdAt: serverTimestamp() });
        });
        await batch.commit();
        const populatedSnapshot = await getDocs(q);
        fetchedItems = populatedSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MarqueeItem));
      }
      setMarqueeItems(fetchedItems);
    } catch (error: any) {
      console.error("Error fetching marquee items:", error);
      toast({ title: "Marquee Error", description: `Could not load marquee items: ${error.message}`, variant: "destructive" });
      setMarqueeItems(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text }))); // Fallback
    } finally {
      setLoadingMarquee(false);
    }
  }, [toast]);

  const fetchUserSupportTickets = useCallback(async () => {
    if (!user) return;
    setLoadingUserSupportTickets(true);
    try {
      const ticketsCollectionRef = collection(db, 'support_tickets');
      const q = query(ticketsCollectionRef, where('userId', '==', user.id), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as SupportTicket;
      });
      setUserSupportTickets(tickets);
    } catch (error: any) {
      console.error("Error fetching user support tickets:", error);
      toast({ title: "Support Tickets Error", description: "Could not load your support tickets.", variant: "destructive" });
    } finally {
      setLoadingUserSupportTickets(false);
    }
  }, [user, toast]);

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

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserData(); 
      fetchTransactions();
      fetchMarqueeItems();
      fetchLeaderboardData();
      fetchFaqs(); 
      refreshUserQuests(); 
      fetchUserSupportTickets(); // Fetch user support tickets

      const userDocRef = doc(db, 'users', user.id);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newUserData = processFirestoreData(data, user);
          setUserDataState(newUserData);
        }
      }, (error: FirestoreError) => {
        console.error("Error in USER snapshot listener (Firestore Permission Denied?):", error.code, error.message);
        toast({ title: "Sync Error: User Data", description: `Could not sync user data. (${error.code})`, variant: "destructive" });
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
        console.error("Error in TRANSACTIONS snapshot listener (Firestore Permission Denied?):", error.code, error.message);
        let description = `Could not listen for transaction updates. (${error.code})`;
        if (error.code === 'failed-precondition') {
          description = "Transactions Error: Firestore index missing. Go to Firebase Console -> Firestore Database -> Indexes, and create a composite index for the 'transactions' collection on fields 'userId' (ascending) AND 'date' (descending).";
        }
        toast({ title: "Database Error: Transactions", description, variant: "destructive", duration: 7000 });
      });

      const marqueeCollectionRef = collection(db, 'marquee_items');
      const qMarquee = query(marqueeCollectionRef, orderBy('createdAt', 'asc'));
      const unsubscribeMarquee = onSnapshot(qMarquee, (querySnapshot) => {
        const items = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MarqueeItem));
        setMarqueeItems(items.length > 0 ? items : CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text }))); 
      }, (error: FirestoreError) => {
        console.error("Error in MARQUEE snapshot listener:", error.code, error.message);
        toast({ title: "Database Error: Marquee", description: `Could not sync marquee messages. (${error.code})`, variant: "destructive" });
        setMarqueeItems(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text })));
      });

      const userQuestsRef = doc(db, 'user_quests', user.id);
      const unsubscribeUserQuests = onSnapshot(userQuestsRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lastRefresh = data.lastQuestRefresh ? (data.lastQuestRefresh as Timestamp).toDate() : null;
          const today = new Date();
          if (!lastRefresh || lastRefresh.toDateString() !== today.toDateString()) {
            await refreshUserQuests();
          } else {
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
          await refreshUserQuests();
        }
      },(error: FirestoreError) => {
        console.error("Error in USER_QUESTS snapshot listener (Firestore Permission Denied?):", error.code, error.message);
        toast({ title: "Database Error: Quests", description: `Could not sync quest data. (${error.code})`, variant: "destructive" });
      });

      const qSupportTickets = query(collection(db, 'support_tickets'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
      const unsubscribeSupportTickets = onSnapshot(qSupportTickets, (querySnapshot) => {
        const tickets = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() || (data.createdAt as Timestamp)?.toDate() || new Date(),
          } as SupportTicket;
        });
        setUserSupportTickets(tickets);
      }, (error: FirestoreError) => {
        console.error("Error in SUPPORT_TICKETS snapshot listener:", error.code, error.message);
        toast({ title: "Database Error: Support Tickets", description: `Could not sync your support tickets. (${error.code})`, variant: "destructive" });
      });


      return () => {
        unsubscribeUser();
        unsubscribeTransactions();
        unsubscribeMarquee();
        unsubscribeUserQuests();
        unsubscribeSupportTickets(); // Unsubscribe support tickets listener
      };

    } else if (!user && !authLoading) {
      setUserDataState(null);
      setTransactions([]);
      setMarqueeItems(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text })));
      setLeaderboard([]);
      setUserQuests([]);
      setFaqs([]);
      setUserSupportTickets([]); // Clear support tickets on logout
      setLoadingUserData(false);
      setLoadingLeaderboard(false);
      setLoadingQuests(false);
      setLoadingFaqs(false);
      setLoadingMarquee(false);
      setLoadingUserSupportTickets(false); // Set loading to false
    }
  }, [user, authLoading, fetchUserData, fetchTransactions, fetchLeaderboardData, processFirestoreData, toast, fetchFaqs, refreshUserQuests, fetchMarqueeItems, fetchUserSupportTickets]);

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
        } catch (error) {
          console.error("Error awarding achievement transaction:", error);
        }
      }
    }
    if (newAchievementsAwarded) {
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
              if (currentData.completedAchievements?.[achievementIdForMilestone]) return; 

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
          } catch (error) {
            console.error("Error awarding referral milestone:", error);
          }
        }
      }
    }
  }, [user, userData, addTransaction, toast]);

  const updateQuestProgress = useCallback(async (questId: string, progressIncrement: number) => {
    if (!user || !userQuests.find(q => q.id === questId && !q.completed)) return;

    const questRef = doc(db, `user_quests/${user.id}/daily_quests`, questId);
    try {
      await updateDoc(questRef, { progress: increment(progressIncrement) });
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.warn(`Quest document ${questId} not found for update (progress). It might have been refreshed. User: ${user.id}`);
      } else {
        console.error(`Error updating progress for quest ${questId}:`, error);
      }
    }
  }, [user, userQuests]);

  const checkAndCompleteQuests = useCallback(async (
    eventType?: QuestDefinition['criteria']['type'],
    eventDetail?: string | number, 
    eventIncrement?: number 
  ) => {
    if (!user || !userData || userQuests.length === 0) return;

    let questsUpdated = false;
    for (const quest of userQuests) {
      if (quest.completed) continue;

      if (!quest.definition || !quest.definition.criteria) {
        console.warn(`Quest ${quest.id} (name: ${quest.definition?.name || 'N/A'}) is missing definition or criteria. Skipping quest check.`);
        continue;
      }

      let progressMadeThisCheck = 0;
      let criteriaMetNow = false;

      const { type, value, page } = quest.definition.criteria;

      if (eventType === type) {
        switch (type) {
          case 'tap_count_total_session': 
            if (eventIncrement) progressMadeThisCheck = eventIncrement;
            break;
          case 'balance_increase_session': 
            if (userData.balance >= value) criteriaMetNow = true; 
            break;
          case 'visit_page':
            if (eventDetail === page) progressMadeThisCheck = 1; 
            break;
          case 'interact_ad': 
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
        if (!criteriaMetNow) { 
           await updateQuestProgress(quest.id, progressMadeThisCheck);
           questsUpdated = true;
        }
      }
      
      if (!criteriaMetNow) {
        switch (type) {
            case 'tap_count_total_session': 
                if (userData.tapCountToday >= value && (quest.progress || 0) < value) {
                  try {
                    await updateDoc(doc(db, `user_quests/${user.id}/daily_quests`, quest.id), { progress: userData.tapCountToday});
                    if(userData.tapCountToday >= value) criteriaMetNow = true;
                  } catch (error: any) {
                     if (error.code === 'not-found') {
                        console.warn(`Quest document ${quest.id} not found for update (tap_count_total_session check). User: ${user.id}`);
                     } else {
                        console.error(`Error updating progress for quest ${quest.id} (tap_count_total_session check):`, error);
                     }
                  }
                }
                break;
        }
      }


      if (criteriaMetNow && !quest.completed) {
        const questRef = doc(db, `user_quests/${user.id}/daily_quests`, quest.id);
        try {
          await updateDoc(questRef, { completed: true, progress: quest.definition.criteria.value });
          toast({ title: "Quest Complete!", description: `You've completed: ${quest.definition.name}`, variant: "default" });
          questsUpdated = true;
        } catch (error: any) {
           if (error.code === 'not-found') {
             console.warn(`Quest document ${quest.id} not found for marking complete. User: ${user.id}`);
           } else {
             console.error(`Error marking quest ${quest.id} complete:`, error);
           }
        }
      }
    }
    if(questsUpdated){
    }

  }, [user, userData, userQuests, toast, updateQuestProgress]);


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

  const submitRedeemRequest = useCallback(async (amount: number, paymentMethod: PaymentMethod, paymentDetails: PaymentDetails) => {
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
      // First, try to delete the existing profile picture if its path is known
      if (userData?.photoStoragePath) {
        try {
          const oldFileRef = storageRef(storage, userData.photoStoragePath);
          await deleteObject(oldFileRef);
        } catch (deleteError: any) {
          // Log but don't block reset if deletion fails (e.g., file already deleted)
          if (deleteError.code !== 'storage/object-not-found') {
            console.warn("Could not delete old profile picture during reset:", deleteError);
          }
        }
      }

      const userDocRef = doc(db, 'users', user.id);
      const now = new Date();
      const defaultRawData: UserData = {
        balance: 0, tapCountToday: 0, lastTapDate: now.toDateString(),
        currentEnergy: CONFIG.INITIAL_MAX_ENERGY,
        maxEnergy: CONFIG.INITIAL_MAX_ENERGY, tapPower: CONFIG.INITIAL_TAP_POWER,
        lastEnergyUpdate: now, boostLevels: {}, lastLoginBonusClaimed: null,
        createdAt: userData?.createdAt || now, // Keep original creation date if available
        photoURL: null, // Reset photoURL
        photoStoragePath: null, // Reset photoStoragePath
        referredBy: userData?.referredBy || null, // Keep original referral if available
        name: userData?.name || user.name || 'User',
        email: userData?.email || user.email || '',
        completedAchievements: {}, referralsMadeCount: 0, // Reset achievements and referral count
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
              
              // Delete old profile picture using photoStoragePath
              if (userData?.photoStoragePath) {
                try {
                  const oldFileRef = storageRef(storage, userData.photoStoragePath);
                  await deleteObject(oldFileRef);
                } catch (deleteError: any) {
                  if (deleteError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old profile picture:", deleteError);
                  }
                }
              }
              
              const userDocRef = doc(db, 'users', user.id);
              await updateDoc(userDocRef, { 
                photoURL: downloadURL,
                photoStoragePath: filePath // Save the new storage path
              });
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
      return true;
    } catch (error: any) {
      console.error("Error during P2P transfer:", error);
      toast({ title: "Transfer Failed", description: error.message || "Could not complete the transfer.", variant: "destructive" });
      return false;
    }
  }, [user, userData, toast]);


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
    } catch (error: any) {
      console.error("Error claiming quest reward:", error);
      toast({ title: "Claim Error", description: error.message || "Failed to claim quest reward.", variant: "destructive" });
    }
  }, [user, userData, userQuests, addTransaction, toast]);

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
      return; 
    }
    if (Math.random() > CONFIG.AI_TIP_FETCH_PROBABILITY) {
      return; 
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
      recentPageVisits: pageHistory.slice(-5), 
      completedAchievementsCount: Object.keys(userData.completedAchievements || {}).length,
      activeTheme: CONFIG.APP_THEMES.find(t => t.id === userData.activeTheme)?.name || 'Default',
    };

    try {
      const result = await getPersonalizedTip(input);
      if ('tip' in result && result.tip) {
        setCurrentPersonalizedTip(result.tip);
      } else if ('error' in result) {
        console.warn("Error fetching personalized tip:", result.error);
        setCurrentPersonalizedTip(null); 
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
      energySurgeEndTime: null, 
    });
    toast({ title: "TAP FRENZY!", description: `Tap power x${CONFIG.TAP_FRENZY_MULTIPLIER} for ${CONFIG.TAP_FRENZY_DURATION_SECONDS} seconds!`, duration: 3000 });
  }, [user, userData, updateUserFirestoreData, toast]);

  const triggerEnergySurge = useCallback(async () => {
    if (!user || !userData) return;
    const surgeEndTime = new Date(Date.now() + CONFIG.ENERGY_SURGE_DURATION_SECONDS * 1000);
    await updateUserFirestoreData({
      energySurgeEndTime: Timestamp.fromDate(surgeEndTime),
      frenzyEndTime: null, 
      frenzyMultiplier: null,
    });
    toast({ title: "ENERGY SURGE!", description: `Taps cost 0 energy for ${CONFIG.ENERGY_SURGE_DURATION_SECONDS} seconds!`, duration: 3000 });
  }, [user, userData, updateUserFirestoreData, toast]);

  return (
    <AppStateContext.Provider value={{
      userData, transactions, marqueeItems, leaderboard, achievements, userQuests, faqs, userSupportTickets,
      loadingUserData, loadingLeaderboard, loadingAchievements, loadingQuests, loadingFaqs, loadingMarquee, loadingUserSupportTickets,
      setUserDataState, fetchUserData, updateUserFirestoreData, addTransaction,
      updateEnergy, purchaseBooster, claimDailyBonus, submitRedeemRequest,
      resetUserProgress, isOnline, pageHistory, addPageVisit,
      fetchLeaderboardData, fetchMarqueeItems, checkAndAwardAchievements, purchaseTheme, setActiveThemeState,
      uploadProfilePicture, transferToUser,
      refreshUserQuests, claimQuestReward, updateQuestProgress,
      submitSupportTicket, fetchFaqs, fetchUserSupportTickets,
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

