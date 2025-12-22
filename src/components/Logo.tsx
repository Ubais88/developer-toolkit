

import { useId } from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const gradientId = useId().replace(/:/g, "-");
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo-600 */}
          <stop offset="100%" stopColor="#7C3AED" /> {/* Violet-600 */}
        </linearGradient>
      </defs>
      <path
        d="M50 15C33.4315 15 20 28.4315 20 45V85C20 87.7614 22.2386 90 25 90C26.7909 90 28.4545 88.9455 29.2893 87.2764L32.5 80.855L35.7107 87.2764C36.5455 88.9455 38.2091 90 40 90C41.7909 90 43.4545 88.9455 44.2893 87.2764L47.5 80.855L50.7107 87.2764C51.5455 88.9455 53.2091 90 55 90C56.7909 90 58.4545 88.9455 59.2893 87.2764L62.5 80.855L65.7107 87.2764C66.5455 88.9455 68.2091 90 70 90C72.7614 90 75 87.7614 75 85V45C75 28.4315 61.5685 15 50 15Z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="38" cy="45" r="5" fill="white" fillOpacity="0.9" />
      <circle cx="62" cy="45" r="5" fill="white" fillOpacity="0.9" />
    </svg>
  );
};
