import { motion } from 'framer-motion';

type ControlLayout = 'right' | 'left' | 'compact';

interface LayoutSelectorProps {
  layout: ControlLayout;
  onChange: (layout: ControlLayout) => void;
}

const options: { value: ControlLayout; label: string }[] = [
  { value: 'right', label: 'Right-handed' },
  { value: 'left', label: 'Left-handed' },
  { value: 'compact', label: 'Compact' }
];

export function LayoutSelector({ layout, onChange }: LayoutSelectorProps) {
  return (
    <div className="glass rounded-2xl px-4 py-3 space-y-2">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Layout</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            className={`rounded-full px-4 py-2 text-sm focus-ring ${
              layout === option.value ? 'bg-accent text-black font-semibold' : 'bg-white/5 text-white/80'
            }`}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.94 }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
