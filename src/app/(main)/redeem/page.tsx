'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { PaymentMethod, PaymentDetails } from '@/types';
import { Wallet, Banknote, AlertCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'paytm', label: 'Paytm' },
  { value: 'googlepay', label: 'Google Pay' },
  { value: 'phonepay', label: 'PhonePe' },
];

export default function RedeemPage() {
  const { userData, submitRedeemRequest, loadingUserData } = useAppState();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adTrigger, setAdTrigger] = useState(false);


  useEffect(() => {
    if (userData && parseFloat(amount) > userData.balance) {
      setFormError('Insufficient balance.');
    } else if (parseFloat(amount) < CONFIG.MIN_REDEEM && amount !== '') {
      setFormError(`Minimum redeem amount is ${CONFIG.MIN_REDEEM} ${CONFIG.COIN_SYMBOL}.`);
    } else {
      setFormError(null);
    }
  }, [amount, userData]);

  const handleDetailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentDetails(prev => ({ ...prev, [e.target.name]: e.target.value.trim() }));
  };

  const validatePaymentDetails = (): boolean => {
    if (!selectedMethod) return false;
    switch (selectedMethod) {
      case 'upi':
        if (!paymentDetails.upiId?.includes('@') || !paymentDetails.upiName) {
          setFormError("Invalid UPI ID or Name."); return false;
        }
        break;
      case 'bank':
        if (!paymentDetails.accNumber || !paymentDetails.ifsc || !paymentDetails.accName || !paymentDetails.bankName) {
          setFormError("All bank fields are required."); return false;
        }
        if (paymentDetails.accNumber !== paymentDetails.confirmAcc) {
          setFormError("Account numbers don't match."); return false;
        }
        if (paymentDetails.ifsc.length !== 11) {
          setFormError("IFSC code must be 11 characters."); return false;
        }
        break;
      case 'paytm': case 'googlepay': case 'phonepay':
        if (!paymentDetails.number || !/^\d{10}$/.test(paymentDetails.number) || !paymentDetails.name) {
          setFormError(`Invalid ${selectedMethod} number or name. Number must be 10 digits.`); return false;
        }
        break;
      default: return false;
    }
    setFormError(null); // Clear previous specific errors if details are now valid
    return true;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || formError || !selectedMethod) {
      toast({ title: "Error", description: formError || "Please select a payment method.", variant: "destructive" });
      return;
    }
    if (!validatePaymentDetails()) {
       // validatePaymentDetails will setFormError, which will be shown by toast if user clicks submit again
       toast({ title: "Error", description: formError || "Invalid payment details.", variant: "destructive" });
       return;
    }

    setIsSubmitting(true);
    try {
      await submitRedeemRequest(parseFloat(amount), selectedMethod, paymentDetails);
      setAmount('');
      setSelectedMethod('');
      setPaymentDetails({});
      // Toast success is handled within submitRedeemRequest
      setAdTrigger(prev => !prev); // Trigger ad refresh
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "Could not submit redeem request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadingUserData || !userData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-lg border-primary">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><Wallet className="mr-2" /> Available Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatNumber(userData.balance)} <span className="text-xl">{CONFIG.COIN_SYMBOL}</span></div>
          <p className="text-sm text-muted-foreground">≈ ₹{formatNumber(balanceInrValue)} INR</p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Banknote className="mr-2 text-green-600" /> Redeem Request</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="redeem-amount">Amount ({CONFIG.COIN_SYMBOL})</Label>
              <Input
                id="redeem-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${CONFIG.MIN_REDEEM} ${CONFIG.COIN_SYMBOL}`}
                min={CONFIG.MIN_REDEEM}
                max={userData.balance}
                step="any"
                required
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Payment Fields */}
            {selectedMethod === 'upi' && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/20 animate-fadeIn">
                <Label className="font-semibold text-primary">UPI Details</Label>
                <div><Label htmlFor="upi-id">UPI ID</Label><Input name="upiId" id="upi-id" placeholder="yourname@upi" onChange={handleDetailChange} value={paymentDetails.upiId || ''} /></div>
                <div><Label htmlFor="upi-name">Full Name</Label><Input name="upiName" id="upi-name" placeholder="Your full name" onChange={handleDetailChange} value={paymentDetails.upiName || ''} /></div>
              </div>
            )}
            {selectedMethod === 'bank' && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/20 animate-fadeIn">
                <Label className="font-semibold text-primary">Bank Details</Label>
                <div><Label htmlFor="account-number">Account Number</Label><Input name="accNumber" id="account-number" placeholder="1234567890" onChange={handleDetailChange} value={paymentDetails.accNumber || ''} /></div>
                <div><Label htmlFor="confirm-account">Confirm Account Number</Label><Input name="confirmAcc" id="confirm-account" placeholder="1234567890" onChange={handleDetailChange} value={paymentDetails.confirmAcc || ''} /></div>
                <div><Label htmlFor="ifsc-code">IFSC Code</Label><Input name="ifsc" id="ifsc-code" placeholder="ABCD0123456" onChange={handleDetailChange} value={paymentDetails.ifsc || ''} /></div>
                <div><Label htmlFor="account-name">Account Holder Name</Label><Input name="accName" id="account-name" placeholder="Your full name" onChange={handleDetailChange} value={paymentDetails.accName || ''} /></div>
                <div><Label htmlFor="bank-name">Bank Name</Label><Input name="bankName" id="bank-name" placeholder="e.g., State Bank of India" onChange={handleDetailChange} value={paymentDetails.bankName || ''} /></div>
              </div>
            )}
            {(selectedMethod === 'paytm' || selectedMethod === 'googlepay' || selectedMethod === 'phonepay') && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/20 animate-fadeIn">
                <Label className="font-semibold text-primary">{paymentMethods.find(p=>p.value === selectedMethod)?.label} Details</Label>
                <div><Label htmlFor={`${selectedMethod}-number`}>{paymentMethods.find(p=>p.value === selectedMethod)?.label} Number</Label><Input name="number" id={`${selectedMethod}-number`} placeholder="9876543210" onChange={handleDetailChange} value={paymentDetails.number || ''} /></div>
                <div><Label htmlFor={`${selectedMethod}-name`}>Account Name</Label><Input name="name" id={`${selectedMethod}-name`} placeholder="Your full name" onChange={handleDetailChange} value={paymentDetails.name || ''} /></div>
              </div>
            )}
             {formError && (
              <p className="text-sm text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {formError}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || !!formError || !selectedMethod || !amount}>
              {isSubmitting ? 'Submitting...' : 'Submit Redeem Request'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg flex items-center"><Info className="mr-2 text-blue-500"/>Conversion & Info</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Conversion Rate: <strong className="text-primary">100 {CONFIG.COIN_SYMBOL} = ₹{formatNumber(100 * CONFIG.CONVERSION_RATE)} INR</strong></p>
            <p className="text-sm text-muted-foreground mt-1">Redeem requests are typically processed within 24-48 hours.</p>
        </CardContent>
      </Card>
      <AdContainer pageContext="redeem" trigger={adTrigger} />
    </div>
  );
}
