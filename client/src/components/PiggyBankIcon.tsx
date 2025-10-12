import { motion } from "framer-motion";

interface PiggyBankIconProps {
  netWorth: number;
  className?: string;
}

export default function PiggyBankIcon({ netWorth, className = "" }: PiggyBankIconProps) {
  const fillPercentage = Math.min(Math.max((netWorth / 1000000) * 100, 10), 100);

  return (
    <div className={`relative ${className}`}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="piggyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset={`${fillPercentage}%`} stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset={`${fillPercentage}%`} stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <motion.g
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ellipse cx="60" cy="70" rx="35" ry="28" fill="url(#piggyGradient)" stroke="hsl(var(--primary))" strokeWidth="2" />
          
          <ellipse cx="60" cy="65" rx="38" ry="30" fill="url(#piggyGradient)" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          
          <rect x="25" y="85" width="8" height="15" rx="4" fill="hsl(var(--primary))" opacity="0.5" />
          <rect x="45" y="85" width="8" height="15" rx="4" fill="hsl(var(--primary))" opacity="0.5" />
          <rect x="67" y="85" width="8" height="15" rx="4" fill="hsl(var(--primary))" opacity="0.5" />
          <rect x="87" y="85" width="8" height="15" rx="4" fill="hsl(var(--primary))" opacity="0.5" />
          
          <path
            d="M 22 65 Q 15 60, 15 55 Q 15 50, 22 48"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          <path
            d="M 98 65 Q 105 60, 105 55 Q 105 50, 98 48"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          <ellipse cx="100" cy="60" rx="6" ry="8" fill="hsl(var(--primary))" opacity="0.4" />
          <path d="M 100 52 L 95 45 L 105 45 Z" fill="hsl(var(--primary))" opacity="0.4" />
          
          <circle cx="50" cy="60" r="3" fill="hsl(var(--foreground))" />
          
          <ellipse cx="70" cy="65" rx="6" ry="4" fill="hsl(var(--primary))" opacity="0.6" />
          
          <rect x="55" y="48" width="20" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.3" />
          <rect x="58" y="50" width="6" height="4" rx="1" fill="hsl(var(--background))" opacity="0.8" />
        </motion.g>
      </svg>
    </div>
  );
}
