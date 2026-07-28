import React from 'react';

interface NexarisLogoProps {
  variant?: 'default' | 'badge' | 'text-only' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const NexarisStarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 50 5 C 51.5 -1.5 54.5 -1.5 56 5 L 61 28 L 81.8 19.4 C 88 16.8 91 21 88.5 27 L 79.9 47.8 L 103 52.8 C 109.5 54.3 109.5 57.3 103 58.8 L 79.9 63.8 L 88.5 84.6 C 91 90.6 88 94.8 81.8 92.2 L 61 83.6 L 56 106.6 C 54.5 113.1 51.5 113.1 50 106.6 L 45 83.6 L 24.2 92.2 C 18 94.8 15 90.6 17.5 84.6 L 26.1 63.8 L 3 58.8 C -3.5 57.3 -3.5 54.3 3 52.8 L 26.1 47.8 L 17.5 27 C 15 21 18 16.8 24.2 19.4 L 45 28 Z" />
  </svg>
);

export const NexarisLogo: React.FC<NexarisLogoProps> = ({
  variant = 'default',
  size = 'md',
  showTagline = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: {
      box: 'h-8',
      icon: 'w-4 h-4',
      badgeIconBox: 'w-7 h-7 rounded-lg',
      text: 'text-base font-bold',
      tagline: 'text-[9px]',
    },
    md: {
      box: 'h-10',
      icon: 'w-5 h-5',
      badgeIconBox: 'w-9 h-9 rounded-xl',
      text: 'text-lg font-extrabold',
      tagline: 'text-[10px]',
    },
    lg: {
      box: 'h-12',
      icon: 'w-6 h-6',
      badgeIconBox: 'w-11 h-11 rounded-2xl',
      text: 'text-2xl font-black',
      tagline: 'text-xs',
    },
    xl: {
      box: 'h-16',
      icon: 'w-8 h-8',
      badgeIconBox: 'w-14 h-14 rounded-2xl',
      text: 'text-3xl font-black',
      tagline: 'text-sm',
    },
  }[size];

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-blue-700 via-blue-600 to-blue-400 text-white shadow-xl overflow-hidden select-none ${className}`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans flex items-baseline">
            Nexar
            <span className="relative inline-flex items-baseline">
              ı
              <span className="absolute -top-[0.20em] left-1/2 -translate-x-1/2 w-[0.42em] h-[0.42em] text-sky-300 pointer-events-none flex items-center justify-center z-10">
                <NexarisStarIcon className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              </span>
            </span>
            s
          </span>
          <NexarisStarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
        </div>
        {showTagline && (
          <p className="mt-2 text-xs sm:text-sm font-semibold tracking-wide text-blue-100 opacity-95">
            One partner. Endless possibilities.
          </p>
        )}
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`${sizeClasses.badgeIconBox} bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ${className}`}
      >
        <NexarisStarIcon className={sizeClasses.icon} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Icon Badge */}
      {variant !== 'text-only' && (
        <div
          className={`${sizeClasses.badgeIconBox} bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0`}
        >
          <NexarisStarIcon className={sizeClasses.icon} />
        </div>
      )}

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={`${sizeClasses.text} tracking-tight font-sans flex items-baseline`}>
            <span className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
              Nexar
            </span>
            <span className="relative inline-flex items-baseline">
              <span className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
                ı
              </span>
              <span className="absolute -top-[0.20em] left-1/2 -translate-x-1/2 w-[0.44em] h-[0.44em] text-blue-600 dark:text-sky-400 pointer-events-none flex items-center justify-center z-10">
                <NexarisStarIcon className="w-full h-full drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
              </span>
            </span>
            <span className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
              s
            </span>
          </span>
        </div>
        {showTagline && (
          <span className={`${sizeClasses.tagline} font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight`}>
            One partner. Endless possibilities.
          </span>
        )}
      </div>
    </div>
  );
};
