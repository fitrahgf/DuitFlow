'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">
        {t('wishlist.readyToBuy')}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface-2/70 px-3 py-2 text-sm text-text-2">
      <span className="font-medium text-text-3">{t('wishlist.coolingLabel')}</span>
      <strong className="font-semibold tracking-[-0.02em] text-text-1">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m
      </strong>
    </div>
  );
}
