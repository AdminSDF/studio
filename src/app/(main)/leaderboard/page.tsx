
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';
import { Trophy, UserCircle, Medal } from 'lucide-react';
import Image from 'next/image';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

const getMedalColor = (rank: number) => {
  if (rank === 1) return 'text-accent'; // Gold
  if (rank === 2) return 'text-muted-foreground'; // Silver
  if (rank === 3) return 'text-primary'; // Bronze (using primary for distinct color)
  return 'text-muted-foreground'; // Default for others
};

export default function LeaderboardPage() {
  const { leaderboard, loadingLeaderboard } = useAppState();

  if (loadingLeaderboard) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-12 w-1/2 mb-4 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-2xl">
            <Trophy className="mr-3 h-8 w-8 text-accent" />
            Top Titans - Leaderboard
          </CardTitle>
          <CardDescription className="text-base">
            See who is leading the charge in {CONFIG.APP_NAME}!
          </CardDescription>
        </CardHeader>
      </Card>

      {leaderboard.length === 0 && !loadingLeaderboard ? (
         <Card className="rounded-xl">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Trophy className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
            <p className="text-lg font-semibold">The leaderboard is empty for now.</p>
            <p className="text-sm">Start mining to make your mark!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <Card key={entry.userId} className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 rounded-xl border-border overflow-hidden">
              <CardContent className="p-4 flex items-center space-x-4">
                <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg rounded-full ${index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {entry.rank}
                </div>
                <Image
                  src={`https://placehold.co/40x40.png?text=${entry.name?.charAt(0)?.toUpperCase() || 'U'}`}
                  alt={`${entry.name}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-primary/30"
                  data-ai-hint="letter avatar"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-foreground text-lg truncate">{entry.name || 'Anonymous Titan'}</p>
                  <p className="text-sm text-primary font-medium">
                    {formatNumber(entry.balance, 0)} {CONFIG.COIN_SYMBOL}
                  </p>
                </div>
                {entry.rank && entry.rank <= 3 && (
                  <Medal className={`h-8 w-8 ${getMedalColor(entry.rank)}`} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
       <PersonalizedTipDisplay />
       <p className="text-xs text-center text-muted-foreground mt-6">
        Leaderboard updates periodically. Top {CONFIG.LEADERBOARD_SIZE} players are shown.
      </p>
    </div>
  );
}
