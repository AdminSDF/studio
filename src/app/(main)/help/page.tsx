
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import type { FAQEntry } from '@/types';
import { HelpCircle, Lightbulb, Zap, Briefcase, Star, Users, Palette, Rocket, Gem, BarChartBig, CheckCircle, Award as AwardIcon } from 'lucide-react'; // Added more icons
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

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

// Helper to get an icon based on category or specific iconName, falling back to a default
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
  const { faqs, loadingFaqs } = useAppState();

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
      </div>
    );
  }

  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQEntry[]>);

  return (
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

      {Object.entries(groupedFaqs).length === 0 && !loadingFaqs ? (
        <Card className="rounded-xl">
          <CardContent className="p-6 text-center text-muted-foreground">
            <HelpCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <p className="text-lg font-semibold">No FAQs found.</p>
            <p className="text-sm">We're working on adding helpful content here soon!</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedFaqs).map(([category, items]) => (
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
      <PersonalizedTipDisplay />
    </div>
  );
}
