
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import type { FAQEntry, SupportTicket, SupportTicketCategory } from '@/types';
import { HelpCircle, Lightbulb, Zap, Briefcase, Star, Users, Palette, Rocket, Gem, BarChartBig, CheckCircle, Award as AwardIcon, MessageSquare, Send, Info, Inbox } from 'lucide-react';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const iconMap: Record<string, React.ElementType> = {
  "Lightbulb": Lightbulb,
  "Zap": Zap,
  "Briefcase": Briefcase,
  "Star": Star,
  "Users": Users,
  "Palette": Palette,
  "Rocket": Rocket,
  "Gem": Gem,
  "BarChartBig": BarChartBig,
  "CheckCircle": CheckCircle,
  "Award": AwardIcon,
  "HelpCircle": HelpCircle,
};

const getFaqIcon = (category?: string, iconName?: string, defaultIcon: React.ElementType = HelpCircle): React.ElementType => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  switch (category?.toLowerCase()) {
    case 'general': return Lightbulb;
    case 'gameplay': return Zap;
    case 'redeem': return Briefcase;
    case 'quests': return Star;
    case 'account': return Users;
    case 'profile': return Users;
    default: return defaultIcon;
  }
};

const getSupportTicketStatusVariant = (status: SupportTicket['status']): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'success';
    case 'open': // Visually "destructive" for admin, but user might see it as "pending" or similar
      return 'destructive'; // Or 'secondary' if 'Open' means 'Pending admin action'
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getSupportTicketStatusTextClass = (status: SupportTicket['status']): string => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'text-success-foreground';
      case 'open':
        return 'text-destructive-foreground'; 
      case 'pending':
        return 'text-secondary-foreground';
      default:
        return 'text-muted-foreground';
    }
}


export default function HelpPage() {
  const { 
    faqs, loadingFaqs, 
    userSupportTickets, loadingUserSupportTickets, fetchUserSupportTickets,
    submitSupportTicket 
  } = useAppState();
  const { toast } = useToast();
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [adTrigger, setAdTrigger] = useState(true);

  useEffect(() => {
    fetchUserSupportTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCategory || !ticketDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a category and provide a description for your ticket.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmittingTicket(true);
    const success = await submitSupportTicket(ticketCategory, ticketDescription.trim());
    if (success) {
      setTicketCategory('');
      setTicketDescription('');
      toast({
        title: 'Ticket Submitted',
        description: 'Your support ticket has been submitted. We will get back to you soon.',
        variant: 'default',
      });
      fetchUserSupportTickets(); // Refresh tickets list after submission
    }
    setIsSubmittingTicket(false);
  };


  const renderLoadingState = () => (
    <div className="p-4 md:p-6 space-y-4">
      <Skeleton className="h-12 w-3/4 mb-4 rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-40 w-full mt-6 rounded-xl" />
      <Skeleton className="h-40 w-full mt-6 rounded-xl" />
    </div>
  );

  if ((loadingFaqs && faqs.length === 0) || (loadingUserSupportTickets && userSupportTickets.length === 0 && !faqs.length)) { // Adjust loading condition
    return renderLoadingState();
  }

  const supportCategories = CONFIG.SUPPORT_TICKET_CATEGORIES;

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 pb-20">
        <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-primary text-2xl">
              <HelpCircle className="mr-3 h-8 w-8 text-accent" />
              Help & Support
            </CardTitle>
            <CardDescription className="text-base">
              Find answers, submit queries, and track your support tickets for {CONFIG.APP_NAME}.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* FAQs Section */}
        {loadingFaqs && faqs.length === 0 ? (
           <Skeleton className="h-60 w-full mt-6 rounded-xl" />
        ) : Object.entries(faqs.reduce((acc, faq) => {
            const category = faq.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(faq);
            return acc;
          }, {} as Record<string, FAQEntry[]>)).length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Info className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-semibold">No FAQs Available.</p>
              <p className="text-sm">We're working on adding helpful content here!</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(faqs.reduce((acc, faq) => {
            const category = faq.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(faq);
            return acc;
          }, {} as Record<string, FAQEntry[]>)).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-4 pl-1">{category} FAQs</h2>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {items.map((faq, index) => {
                  const IconComponent = getFaqIcon(faq.category, faq.iconName);
                  return (
                    <AccordionItem value={`item-${category}-${index}`} key={faq.id || index} className="bg-card border border-border/70 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="p-4 text-left hover:no-underline text-base font-medium text-foreground">
                        <div className="flex items-center">
                          <IconComponent className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                          {faq.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0 text-muted-foreground accordion-content-custom">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))
        )}

        <Separator className="my-8" />

        {/* Submit New Support Ticket Section */}
        <Card className="shadow-xl border-accent/30 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-accent text-2xl">
              <MessageSquare className="mr-3 h-8 w-8 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription className="text-base">
              Still need help? Submit a support ticket and we'll get back to you.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleTicketSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ticket-category" className="font-medium">Category</Label>
                <Select value={ticketCategory} onValueChange={setTicketCategory}>
                  <SelectTrigger id="ticket-category" className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticket-description" className="font-medium">Describe your issue</Label>
                <Textarea
                  id="ticket-description"
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  rows={5}
                  className="mt-1"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/80" disabled={isSubmittingTicket}>
                {isSubmittingTicket ? 'Submitting...' : (
                  <>
                    <Send className="mr-2 h-5 w-5" /> Submit Ticket
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Separator className="my-8" />

        {/* Your Support Tickets Section */}
        <Card className="shadow-xl border-primary/30 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-primary text-2xl">
              <Inbox className="mr-3 h-8 w-8 text-accent" />
              Your Support Tickets
            </CardTitle>
            <CardDescription className="text-base">
              Track the status and responses to your submitted tickets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUserSupportTickets ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ) : userSupportTickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">You haven't submitted any support tickets yet.</p>
            ) : (
              <Accordion type="multiple" className="w-full space-y-3">
                {userSupportTickets.map((ticket, index) => (
                  <AccordionItem value={`ticket-${ticket.id || index}`} key={ticket.id || index} className="bg-muted/30 border border-border/70 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <AccordionTrigger className="p-4 text-left hover:no-underline">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                        <div className="flex items-center mb-1 sm:mb-0">
                           <Badge 
                            variant={getSupportTicketStatusVariant(ticket.status)} 
                            className={cn(
                                "text-xs capitalize px-2 py-1 mr-3", 
                                getSupportTicketStatusTextClass(ticket.status),
                                ticket.status === 'open' ? 'bg-destructive text-destructive-foreground' : '' // Ensure specific style for "open"
                            )}
                          >
                            {ticket.status === 'open' ? 'Closed' : ticket.status}
                          </Badge>
                          <span className="font-medium text-foreground text-sm sm:text-base">
                            {ticket.category}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
                          Submitted: {new Date(ticket.createdAt as any).toLocaleDateString()}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">Your Issue:</Label>
                        <p className="text-sm text-foreground whitespace-pre-wrap bg-background/50 p-2 rounded-md border border-border/30 mt-1">{ticket.description}</p>
                      </div>
                      {ticket.adminResponse && (
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Admin Response:</Label>
                          <p className="text-sm text-foreground whitespace-pre-wrap bg-primary/5 p-2 rounded-md border border-primary/20 mt-1">{ticket.adminResponse}</p>
                        </div>
                      )}
                      {!ticket.adminResponse && (ticket.status === 'open' || ticket.status === 'pending') && (
                         <p className="text-xs text-amber-600 italic">An admin will review your ticket soon.</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Last Updated: {new Date(ticket.updatedAt as any || ticket.createdAt as any).toLocaleString()}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <PersonalizedTipDisplay />
      </div>
      <div className="w-full my-4 -mx-4 md:-mx-6">
        <AdContainer pageContext="help" trigger={adTrigger} />
      </div>
    </>
  );
}
