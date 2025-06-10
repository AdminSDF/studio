
'use client';

import { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react'; 
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { PaymentMethod, PaymentDetails, Html5QrcodeError, Html5QrcodeResult } from '@/types';
import { Wallet, Banknote, AlertCircle, Info, Send, Users, QrCode as QrCodeIcon } from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Html5QrcodeScanner } from 'html5-qrcode'; 
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'paytm', label: 'Paytm' },
  { value: 'googlepay', label: 'Google Pay' },
  { value: 'phonepay', label: 'PhonePe' },
];

const QR_READER_ELEMENT_ID_REDEEM = "qr-reader-redeem";

export default function RedeemPage() {
  const { userData, submitRedeemRequest, loadingUserData, transferToUser } = useAppState();
  const { toast } = useToast();

  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [redeemFormError, setRedeemFormError] = useState<string | null>(null);
  const [isSubmittingRedeem, setIsSubmittingRedeem] = useState(false);
  
  const [p2pRecipientId, setP2pRecipientId] = useState<string>('');
  const [p2pAmount, setP2pAmount] = useState<string>('');
  const [p2pFormError, setP2pFormError] = useState<string | null>(null);
  const [isSubmittingP2P, setIsSubmittingP2P] = useState(false);

  const [adTrigger, setAdTrigger] = useState(true); // Trigger ad on initial load
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const html5QrCodeScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    if (userData && parseFloat(redeemAmount) > userData.balance) {
      setRedeemFormError('Insufficient balance.');
    } else if (parseFloat(redeemAmount) < CONFIG.MIN_REDEEM && redeemAmount !== '') {
      setRedeemFormError(`Minimum redeem amount is ${CONFIG.MIN_REDEEM} ${CONFIG.COIN_SYMBOL}.`);
    } else {
      setRedeemFormError(null);
    }
  }, [redeemAmount, userData]);

  useEffect(() => {
    if (userData && parseFloat(p2pAmount) > userData.balance) {
      setP2pFormError('Insufficient balance to send.');
    } else if (parseFloat(p2pAmount) <= 0 && p2pAmount !== '') {
      setP2pFormError('Transfer amount must be positive.');
    } else {
      setP2pFormError(null);
    }
  }, [p2pAmount, userData]);

  const handleDetailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentDetails(prev => ({ ...prev, [e.target.name]: e.target.value.trim() }));
  };

  const validatePaymentDetails = (): boolean => {
    if (!selectedMethod) return false;
    switch (selectedMethod) {
      case 'upi':
        if (!paymentDetails.upiId?.includes('@') || !paymentDetails.upiName) {
          setRedeemFormError("Invalid UPI ID or Name."); return false;
        }
        break;
      case 'bank':
        if (!paymentDetails.accNumber || !paymentDetails.ifsc || !paymentDetails.accName || !paymentDetails.bankName) {
          setRedeemFormError("All bank fields are required."); return false;
        }
        if (paymentDetails.accNumber !== paymentDetails.confirmAcc) {
          setRedeemFormError("Account numbers don't match."); return false;
        }
        if (paymentDetails.ifsc.length !== 11) {
          setRedeemFormError("IFSC code must be 11 characters."); return false;
        }
        break;
      case 'paytm': case 'googlepay': case 'phonepay':
        if (!paymentDetails.number || !/^\d{10}$/.test(paymentDetails.number) || !paymentDetails.name) {
          setRedeemFormError(`Invalid ${selectedMethod} number or name. Number must be 10 digits.`); return false;
        }
        break;
      default: return false;
    }
    setRedeemFormError(null); 
    return true;
  };


  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || redeemFormError || !selectedMethod) {
      toast({ title: "Error", description: redeemFormError || "Please select a payment method.", variant: "destructive" });
      return;
    }
    if (!validatePaymentDetails()) {
       toast({ title: "Error", description: redeemFormError || "Invalid payment details.", variant: "destructive" });
       return;
    }

    setIsSubmittingRedeem(true);
    try {
      await submitRedeemRequest(parseFloat(redeemAmount), selectedMethod, paymentDetails);
      setRedeemAmount('');
      setSelectedMethod('');
      setPaymentDetails({});
      setAdTrigger(prev => !prev); 
    } catch (error: any) {
      // Error toast handled by submitRedeemRequest
    } finally {
      setIsSubmittingRedeem(false);
    }
  };

  const handleP2PSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || p2pFormError || !p2pRecipientId || !p2pAmount) {
      toast({ title: "Error", description: p2pFormError || "Please fill all P2P transfer fields.", variant: "destructive" });
      return;
    }
    
    setIsSubmittingP2P(true);
    const success = await transferToUser(p2pRecipientId.trim(), parseFloat(p2pAmount));
    if (success) {
      setP2pRecipientId('');
      setP2pAmount('');
      setAdTrigger(prev => !prev);
    }
    setIsSubmittingP2P(false);
  };

  const onScanSuccess = useCallback((decodedText: string, result: Html5QrcodeResult) => {
    setP2pRecipientId(decodedText);
    setIsScannerOpen(false); 
    setHasCameraPermission(null); 
    toast({ title: "QR Scanned!", description: "Recipient ID populated." });
  }, [toast]);

  const onScanFailure = useCallback((error: string | Html5QrcodeError) => {
    let errorMessage = "Failed to scan QR code. Please ensure the QR code is clear and centered.";
    if (typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError') {
      errorMessage = "Camera permission denied. Please enable camera access in your browser settings to scan QR codes.";
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Permission Denied',
        description: errorMessage,
        duration: 7000, 
      });
    } else if (typeof error === 'string' && (error.toLowerCase().includes("permission denied") || error.toLowerCase().includes("notallowederror")) ) {
      errorMessage = "Camera permission denied. Please enable camera access in your browser settings to scan QR codes.";
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Permission Denied',
        description: errorMessage,
        duration: 7000,
      });
    }
    setQrScanError(errorMessage);
  }, [toast]);
  
  useEffect(() => {
    if (isScannerOpen) {
      setHasCameraPermission(null); 
      setQrScanError(null);       

      const qrReaderElement = document.getElementById(QR_READER_ELEMENT_ID_REDEEM);
      if (qrReaderElement && !html5QrCodeScannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          QR_READER_ELEMENT_ID_REDEEM,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            supportedScanTypes: [], 
            rememberLastUsedCamera: true,
            aspectRatio: 1.0 
          },
          false
        );
        
        scanner.render(onScanSuccess, onScanFailure)
          .catch(renderError => {
            console.error("Error during scanner.render() setup:", renderError);
            let setupErrorMessage = "Could not start QR scanner.";
            if (typeof renderError === 'object' && (renderError as any).name === 'NotAllowedError') {
              setupErrorMessage = "Camera permission was denied. Please enable camera access in your browser settings.";
              setHasCameraPermission(false);
              toast({ variant: 'destructive', title: 'Camera Setup Failed', description: setupErrorMessage, duration: 7000 });
            }
            setQrScanError(setupErrorMessage);
          });
        html5QrCodeScannerRef.current = scanner;
      }
    } else { 
      if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear()
          .catch(err => console.error("Failed to clear scanner on close/cleanup:", err));
        html5QrCodeScannerRef.current = null;
      }
    }
  
    return () => {
      if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear()
          .catch(err => console.error("Failed to clear scanner on unmount:", err));
        html5QrCodeScannerRef.current = null;
      }
    };
  }, [isScannerOpen, onScanSuccess, onScanFailure, toast]);
  
  if (loadingUserData || !userData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" /> 
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;

  return (
    <>
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
            <CardTitle className="flex items-center text-lg"><Banknote className="mr-2 text-primary" /> Withdraw to Bank/UPI</CardTitle>
            <CardDescription>Exchange your {CONFIG.COIN_SYMBOL} for real-world value.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRedeemSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="redeem-amount">Amount ({CONFIG.COIN_SYMBOL})</Label>
                <Input
                  id="redeem-amount"
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
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
              {redeemFormError && (
                <p className="text-sm text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {redeemFormError}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmittingRedeem || !!redeemFormError || !selectedMethod || !redeemAmount}>
                {isSubmittingRedeem ? 'Submitting...' : 'Submit Redeem Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Separator />

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Users className="mr-2 text-primary" /> Send {CONFIG.COIN_SYMBOL} to Another User</CardTitle>
            <CardDescription>Transfer your {CONFIG.COIN_SYMBOL} directly to a friend.</CardDescription>
          </CardHeader>
          <form onSubmit={handleP2PSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="p2p-recipient-id">Recipient's User ID</Label>
                <div className="flex space-x-2 items-end">
                  <Input
                    id="p2p-recipient-id"
                    type="text"
                    value={p2pRecipientId}
                    onChange={(e) => setP2pRecipientId(e.target.value)}
                    placeholder="Enter or scan User ID"
                    required
                    className="flex-grow"
                  />
                  <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button" size="icon" aria-label="Scan QR Code">
                        <QrCodeIcon className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Scan User ID QR Code</DialogTitle>
                      </DialogHeader>
                      
                      {hasCameraPermission === false ? (
                        <div className="text-destructive text-center p-4 rounded-md border border-destructive bg-destructive/10 my-4">
                          <AlertCircle className="mx-auto h-10 w-10 mb-2" />
                          <p className="font-semibold">Camera Access Denied</p>
                          <p className="text-sm">{qrScanError || "Please enable camera permissions in your browser settings and try again."}</p>
                        </div>
                      ) : (
                        <div id={QR_READER_ELEMENT_ID_REDEEM} style={{ width: '100%', minHeight: '250px' }} className="my-4 border rounded-md overflow-hidden bg-muted/30">
                          {(hasCameraPermission === null && !qrScanError && isScannerOpen) && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                              <QrCodeIcon className="h-12 w-12 mb-2 animate-pulse text-primary" />
                              <p>Requesting camera access...</p>
                              <p className="text-xs mt-1">Point your camera at a QR code.</p>
                            </div>
                          )}
                        </div>
                      )}
                      {qrScanError && hasCameraPermission !== false && ( 
                          <p className="text-destructive text-sm text-center mt-[-8px] mb-2">{qrScanError}</p>
                      )}
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel Scan</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div>
                <Label htmlFor="p2p-amount">Amount to Send ({CONFIG.COIN_SYMBOL})</Label>
                <Input
                  id="p2p-amount"
                  type="number"
                  value={p2pAmount}
                  onChange={(e) => setP2pAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0.01" 
                  step="any"
                  required
                />
              </div>
              {p2pFormError && (
                <p className="text-sm text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-1" /> {p2pFormError}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmittingP2P || !!p2pFormError || !p2pRecipientId || !p2pAmount}>
                {isSubmittingP2P ? 'Sending...' : <><Send className="mr-2 h-4 w-4" />Send {CONFIG.COIN_SYMBOL}</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
              <CardTitle className="text-lg flex items-center"><Info className="mr-2 text-primary"/>Conversion & Info</CardTitle>
          </CardHeader>
          <CardContent>
              <p>Withdrawal Conversion Rate: <strong className="text-primary">100 {CONFIG.COIN_SYMBOL} = ₹{formatNumber(100 * CONFIG.CONVERSION_RATE)} INR</strong></p>
              <p className="text-sm text-muted-foreground mt-1">Redeem requests are typically processed within 24-48 hours.</p>
              <p className="text-sm text-muted-foreground mt-1">P2P transfers are instant but irreversible. Always double-check the recipient ID.</p>
          </CardContent>
        </Card>
        <PersonalizedTipDisplay />
      </div>
      <div className="w-full my-4 -mx-4 md:-mx-6">
        <AdContainer pageContext="redeem" trigger={adTrigger} />
      </div>
    </>
  );
}
