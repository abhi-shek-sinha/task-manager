import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  dueDate: string;
  status: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ dueDate, status }) => {
  // FIX: Pass a function to useState. 
  // This prevents the impure Date.now() from being executed on every re-render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Don't run the interval if the task is already done/expired
    if (status === 'completed' || status === 'expired') return;

    const interval = setInterval(() => {
      // It is perfectly safe (and pure) to call Date.now() inside an effect callback
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // new Date(string) is pure because it always returns the exact same time for the same string
  const difference = new Date(dueDate).getTime() - now;
  const isExpired = difference <= 0 || status === 'expired';

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Clock className="w-3.5 h-3.5" /> Task Finished
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5" /> Time Expired
      </span>
    );
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200/50 dark:border-amber-800/40">
      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span>
        {days > 0 && `${days}d `}
        {String(hours).padStart(2, '0')}h{' '}
        {String(minutes).padStart(2, '0')}m{' '}
        {String(seconds).padStart(2, '0')}s left
      </span>
    </div>
  );
};