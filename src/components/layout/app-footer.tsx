
'use client';

import { CONFIG } from '@/lib/constants';
import { useEffect, useState } from 'react';

export function AppFooter() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-card text-muted-foreground p-4 text-center border-t border-border text-xs flex-shrink-0">
      <p>&copy; {currentYear} {CONFIG.APP_NAME}. All rights reserved.</p>
      <p className="mt-1">Built with 💙 for tapping enthusiasts.</p>
    </footer>
  );
}
