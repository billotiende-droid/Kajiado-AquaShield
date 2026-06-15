'use client';

import { AlertTriangle } from 'lucide-react';

interface WarningBannerProps {
  message: string;
  type?: 'warning' | 'info' | 'alert';
}

export function WarningBanner({ message, type = 'warning' }: WarningBannerProps) {
  const getStyles = () => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
        };
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 flex gap-3`}>
      <AlertTriangle className={`${styles.icon} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <p className={`${styles.text} text-sm leading-relaxed`}>{message}</p>
    </div>
  );
}
