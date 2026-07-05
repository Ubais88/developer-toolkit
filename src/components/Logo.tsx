import { useId } from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const gradientId = useId().replace(/:/g, "-");
  const highlightId = useId().replace(/:/g, "-");
  const shadowId = useId().replace(/:/g, "-");
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="16" y1="14" x2="86" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id={highlightId} x1="22" y1="18" x2="74" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowId} x="-18%" y="-18%" width="136%" height="136%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="22"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />
      <path d="M24 20H58C72 20 80 28 80 42V76" stroke={`url(#${highlightId})`} strokeWidth="2.5" strokeLinecap="round" />

      <path
        d="M35 29V58C35 70 41 77 50 77C59 77 65 70 65 58V29"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 39L23 47L31 55M69 39L77 47L69 55"
        stroke="#DDE5F3"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.88"
      />
      <path d="M55 43L46 63" stroke="#93C5FD" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="72" cy="27" r="3.5" fill="#93C5FD" />
    </svg>
  );
};
