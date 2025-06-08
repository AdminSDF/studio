
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

const WRITING_SPEED_MS = 50; // Milliseconds per character

export function PersonalizedTipDisplay() {
  const { currentPersonalizedTip, getAndSetPersonalizedTip } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);

  const animationFrameIdRef = useRef<number | null>(null);
  const cursorIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTip = async () => {
      setIsLoading(true);
      await getAndSetPersonalizedTip();
      setIsLoading(false);
    };
    fetchTip();
  }, [getAndSetPersonalizedTip]);

  useEffect(() => {
    // Cleanup function to clear any ongoing animations/intervals when component unmounts
    // or when currentPersonalizedTip changes (triggering a new animation sequence).
    const cleanupAnimation = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (cursorIntervalIdRef.current) {
        clearInterval(cursorIntervalIdRef.current);
        cursorIntervalIdRef.current = null;
      }
      setShowCursor(false);
    };
  
    if (currentPersonalizedTip && !isLoading) {
      cleanupAnimation(); // Clear previous animation artifacts before starting a new one
      setAnimatedText('');
      setShowCursor(true); // Show cursor immediately when starting to type
  
      let index = 0;
      let lastFrameTime = performance.now();
  
      const typeCharacter = (currentTime: number) => {
        if (currentTime - lastFrameTime >= WRITING_SPEED_MS) {
          if (index < currentPersonalizedTip.length) {
            setAnimatedText((prev) => prev + currentPersonalizedTip.charAt(index));
            index++;
            lastFrameTime = currentTime;
          } else {
            // Typing finished
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Stop animation frames
            animationFrameIdRef.current = null; // Clear ref
            
            // Start blinking cursor
            cursorIntervalIdRef.current = setInterval(() => {
              setShowCursor(prev => !prev);
            }, 500);
            return; // Exit animation loop
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(typeCharacter);
      };
      animationFrameIdRef.current = requestAnimationFrame(typeCharacter);
  
    } else if (!currentPersonalizedTip && !isLoading) {
      // No tip available, ensure everything is reset
      setAnimatedText('');
      cleanupAnimation();
    }
  
    return cleanupAnimation; // Cleanup on unmount or before next effect run due to tip change
  }, [currentPersonalizedTip, isLoading]);


  const handleRefreshTip = async () => {
    setIsLoading(true);
    setAnimatedText(''); // Clear old text immediately
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (cursorIntervalIdRef.current) clearInterval(cursorIntervalIdRef.current);
    setShowCursor(false);
    await getAndSetPersonalizedTip(); // This will update currentPersonalizedTip and trigger the useEffect above
    // setIsLoading(false); // isLoading is set to false inside the fetchTip useEffect dependency
  };

  // Show skeleton only if actively loading AND there's no text to display yet
  if (isLoading && animatedText === '' && !currentPersonalizedTip) {
    return (
      <Card className="my-4 shadow-md rounded-xl border-border/70 bg-muted/30">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center text-primary">
            <Lightbulb className="h-4 w-4 mr-2 animate-pulse" />
            Thinking of a tip...
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // If there's no tip (even after loading attempts) and we are not actively loading a new one, don't render.
  if (!currentPersonalizedTip && !isLoading && animatedText === '') {
    return null;
  }

  return (
    <Card className="my-4 shadow-lg rounded-xl border-accent/30 bg-gradient-to-r from-accent/10 via-card to-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
      <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center text-accent">
          <Lightbulb className="h-5 w-5 mr-2" />
          Quick Tip
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleRefreshTip} className="h-7 w-7 text-muted-foreground hover:text-accent" aria-label="Refresh tip" disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm text-foreground min-h-[40px]">
        {animatedText}
        {showCursor && <span className="animate-pulse">|</span>}
        {/* If loading a new tip while an old one is displayed, show a subtle loading indicator */}
        {isLoading && currentPersonalizedTip && animatedText === currentPersonalizedTip && (
            <span className="ml-1 opacity-50 text-xs">(refreshing...)</span>
        )}
      </CardContent>
    </Card>
  );
}
