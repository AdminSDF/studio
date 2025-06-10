
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import type { FAQEntry, SupportTicketCategory } from '@/types';
import { HelpCircle, Lightbulb, Zap, Briefcase, Star, Users, Palette, Rocket, Gem, BarChartBig, CheckCircle, Award as AwardIcon, MessageSquare, Send } from 'lucide-react';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';

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

export default function HelpPage() {
  const { faqs, loadingFaqs, submitSupportTicket } = useAppState();
  const { toast } = useToast();
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [adTrigger, setAdTrigger] = useState(true); // Trigger ad on initial load


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
    }
    // Error toast is handled by submitSupportTicket in AppStateProvider
    setIsSubmittingTicket(false);
  };

  if (loadingFaqs && faqs.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-12 w-3/4 mb-4 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-60 w-full mt-6 rounded-xl" />
      </div>
    );
  }

  const supportCategories = CONFIG.SUPPORT_TICKET_CATEGORIES;

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 pb-20">
        <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-primary text-2xl">
              <HelpCircle className="mr-3 h-8 w-8 text-accent" />
              Help & FAQs
            </CardTitle>
            <CardDescription className="text-base">
              Find answers to common questions about {CONFIG.APP_NAME}.
            </CardDescription>
          </CardHeader>
        </Card>

        {Object.entries(faqs.reduce((acc, faq) => {
          const category = faq.category || 'Other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(faq);
          return acc;
        }, {} as Record<string, FAQEntry[]>)).length === 0 && !loadingFaqs ? (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center text-muted-foreground">
              <HelpCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-semibold">No FAQs found.</p>
              <p className="text-sm">We're working on adding helpful content here soon!</p>
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
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-4 pl-1">{category}</h2>
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

        <Card className="shadow-xl border-accent/30 rounded-xl mt-8">
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

        <PersonalizedTipDisplay />
      </div>
      <div className="w-full my-4 -mx-4 md:-mx-6">
        <AdContainer pageContext="help" trigger={adTrigger} />
      </div>
    </>
  );
}
