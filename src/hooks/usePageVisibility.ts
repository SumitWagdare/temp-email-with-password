'use client';

import { useState, useEffect } from 'react';

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    setIsVisible(document.visibilityState === 'visible');

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
