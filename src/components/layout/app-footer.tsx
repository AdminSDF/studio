'use client';

import { CONFIG } from '@/lib/constants';
import { useEffect, useState } from 'react';

export function AppFooter() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-primary text-primary-foreground p-3 text-center border-t-4 border-accent text-sm flex-shrink-0">
      <p>&copy; {currentYear} {CONFIG.APP_NAME}. All rights reserved.</p>
    </footer>
  );
}
