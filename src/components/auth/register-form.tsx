
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CONFIG } from '@/lib/constants';
import type { UserData } from '@/types';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });

      let initialBalance = 0;
      let referredByUID: string | null = null;

      if (referralCode) {
        try {
          const referrerDocRef = doc(db, 'users', referralCode);
          const referrerDoc = await getDoc(referrerDocRef);
          if (referrerDoc.exists() && referrerDoc.id !== firebaseUser.uid) {
            initialBalance += CONFIG.REFERRAL_BONUS_FOR_NEW_USER;
            referredByUID = referralCode;
            
            // Increment referrer's referralsMadeCount
            await updateDoc(referrerDocRef, {
              referralsMadeCount: increment(1)
            });
            // Consider giving bonus to referrer as well (server-side function recommended for security)
            // For now, just tracking count. Bonus logic can be added later.
            toast({ title: 'Referral Applied!', description: `You received ${CONFIG.REFERRAL_BONUS_FOR_NEW_USER} ${CONFIG.COIN_SYMBOL} bonus!`, variant: 'default' });
          } else {
            toast({ title: 'Invalid Referral', description: 'Referral code is invalid or cannot be self-referral.', variant: 'destructive' });
          }
        } catch (err) {
          console.warn("Error validating or updating referrer:", err);
          toast({ title: 'Referral Error', description: 'Could not process referral code.', variant: 'destructive' });
        }
      }
      
      const now = new Date();
      const newUserDoc: UserData = {
        balance: initialBalance,
        tapCountToday: 0,
        lastTapDate: now.toDateString(),
        currentEnergy: CONFIG.INITIAL_MAX_ENERGY,
        maxEnergy: CONFIG.INITIAL_MAX_ENERGY,
        tapPower: CONFIG.INITIAL_TAP_POWER,
        lastEnergyUpdate: Timestamp.fromDate(now),
        boostLevels: {},
        lastLoginBonusClaimed: null,
        referredBy: referredByUID,
        createdAt: Timestamp.fromDate(new Date(firebaseUser.metadata.creationTime || now)),
        name: name,
        email: email,
        completedAchievements: {},
        referralsMadeCount: 0,
        activeTheme: CONFIG.APP_THEMES[0].id, // Default theme
        unlockedThemes: [CONFIG.APP_THEMES[0].id], // Default theme is unlocked
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);

      toast({ title: 'Success', description: 'Registration successful! Please login.' });
      router.push('/login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: 'Registration Failed', description: 'This email is already in use. Try logging in.', variant: 'destructive' });
      } else {
        toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-3xl font-bold text-center text-primary">{`Create ${CONFIG.APP_NAME} Account`}</h2>
      <div className="space-y-1">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input id="reg-name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reg-password">Password</Label>
        <Input id="reg-password" type="password" placeholder="Create a password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reg-confirm">Confirm Password</Label>
        <Input id="reg-confirm" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reg-referral">Referral Code (Optional)</Label>
        <Input id="reg-referral" placeholder="Enter referral code" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
      <div className="text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}
