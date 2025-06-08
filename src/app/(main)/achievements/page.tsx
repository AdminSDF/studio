
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONFIG } from '@/lib/constants';
import type { Achievement } from '@/types';
import { Award, CheckCircle, Star, TrendingUp, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

const getAchievementProgress = (achievement: Achievement, userData: any): number => {
  if (!userData) return 0;
  switch (achievement.criteria.type) {
    case 'tap_count_today':
      return Math.min(100, (userData.tapCountToday / achievement.criteria.value) * 100);
    case 'balance_reach':
      return Math.min(100, (userData.balance / achievement.criteria.value) * 100);
    case 'referrals_made':
      return Math.min(100, ((userData.referralsMadeCount || 0) / achievement.criteria.value) * 100);
    case 'booster_purchase_specific': // This is harder to track progress for "any". Assume 0 or 100 if any booster is bought.
      // For specific boosterId, it would be more complex. For now, just 0 or 100.
      // A simple check could be if any booster level > 0 for "any".
      if (achievement.criteria.boosterId === 'any' && Object.values(userData.boostLevels || {}).some(level => (level as number) > 0)) return 100;
      return 0; // Placeholder for more specific tracking
    default:
      return 0;
  }
};

export default function AchievementsPage() {
  const { userData, loadingUserData } = useAppState();
  const achievements = CONFIG.ACHIEVEMENTS;

  if (loadingUserData || !userData) {
     return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-3/4 mb-6 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const completedAchievements = userData.completedAchievements || {};

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-2xl">
            <Award className="mr-3 h-8 w-8 text-accent" />
            Achievements & Milestones
          </CardTitle>
          <CardDescription className="text-base">
            Complete goals to earn bonus {CONFIG.COIN_SYMBOL}!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((ach) => {
          const isCompleted = !!completedAchievements[ach.id];
          const progress = isCompleted ? 100 : getAchievementProgress(ach, userData);
          const IconComponent = ach.icon || Star;

          return (
            <Card key={ach.id} className={cn(
              "shadow-lg rounded-xl border-border transition-all duration-300",
              isCompleted ? "bg-success/10 border-success/50" : "hover:shadow-primary/20"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    <IconComponent className={cn("mr-2.5 h-6 w-6", isCompleted ? "text-success" : "text-primary")} />
                    {ach.name}
                  </CardTitle>
                  {isCompleted && <CheckCircle className="h-7 w-7 text-success" />}
                </div>
                <CardDescription className="text-sm mt-1">{ach.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  Reward: <strong className="text-accent font-semibold">{formatNumber(ach.reward)} {CONFIG.COIN_SYMBOL}</strong>
                </p>
                {!isCompleted && (
                  <div>
                    <Progress value={progress} className="h-2.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
                    <p className="text-xs text-muted-foreground text-right mt-1">{Math.floor(progress)}% complete</p>
                  </div>
                )}
                {isCompleted && (
                   <p className="text-sm text-success font-semibold">
                     Completed on {new Date((completedAchievements[ach.id] as any).toDate()).toLocaleDateString()}
                   </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <PersonalizedTipDisplay />
    </div>
  );
}
