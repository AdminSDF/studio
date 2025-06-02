
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { CONFIG } from '@/lib/constants';
import { Eye, EyeOff, LogIn } from 'lucide-react'; // Added icons

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Success', description: 'Logged in successfully!' });
      // AuthProvider will handle redirect
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-primary mb-8">
        Welcome Back to {CONFIG.APP_NAME}
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium text-muted-foreground">Email Address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 px-4 text-base transition-all duration-300 ease-in-out border-input focus:border-primary focus:ring-2 focus:ring-primary/40 focus:placeholder-transparent"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-sm font-medium text-muted-foreground">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 px-4 text-base transition-all duration-300 ease-in-out border-input focus:border-primary focus:ring-2 focus:ring-primary/40 focus:placeholder-transparent pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-lg font-semibold transition-all duration-300 ease-in-out hover:shadow-primary/30 hover:shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" /> Login
          </>
        )}
      </Button>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline hover:text-accent transition-colors">
            Register Now
          </Link>
        </p>
      </div>
    </form>
  );
}

