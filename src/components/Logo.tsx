import { useId } from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const gradientId = useId().replace(/:/g, "-");
  const glowId = useId().replace(/:/g, "-");
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main vibrant gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="#8B5CF6" /> {/* Violet */}
          <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
        </linearGradient>

        {/* Glow filter for premium neon effect */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Outer Frame */}
      <polygon
        points="50,10 88,32 88,78 50,90 12,78 12,32"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
        opacity="0.25"
      />

      {/* Inner Stylized U / Code Bracket ribbon */}
      <path
        d="M32 30 V58 C32 68 38 74 50 74 C62 74 68 68 68 58 V30 
           M32 30 H42 V58 C42 63 45 65 50 65 C55 65 58 63 58 58 V30 H68"
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        clipRule="evenodd"
        filter={`url(#${glowId})`}
      />

      {/* Futuristic central code slash/accent */}
      <path
        d="M45 42 L55 58"
        stroke="#06B6D4"
        strokeWidth="4"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />
    </svg>
  );
};
