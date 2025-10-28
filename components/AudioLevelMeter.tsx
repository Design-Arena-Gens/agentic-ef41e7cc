import { motion } from 'framer-motion';

interface AudioLevelMeterProps {
  level: number;
}

export function AudioLevelMeter({ level }: AudioLevelMeterProps) {
  const bars = Array.from({ length: 12 }, (_, index) => index);
  return (
    <div
      aria-label="Audio level"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(level.toFixed(2))}
      className="flex items-end gap-1 h-12"
      role="meter"
    >
      {bars.map((bar) => {
        const threshold = (bar + 1) / bars.length;
        const active = level > threshold * 0.6;
        return (
          <motion.span
            key={bar}
            aria-hidden
            className={`w-1 rounded-full ${active ? 'bg-accent' : 'bg-white/10'}`}
            animate={{ height: `${Math.min(100, Math.max(10, level * 120))}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          />
        );
      })}
    </div>
  );
}
