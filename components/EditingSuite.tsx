import { motion } from 'framer-motion';
import { FILTER_PRESETS, type FilterKey, ASPECT_RATIOS } from '@/lib/editingPresets';

interface EditingSuiteProps {
  videoUrl: string | null;
  filter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  aspectRatio: (typeof ASPECT_RATIOS)[number]['id'];
  onAspectRatioChange: (ratio: (typeof ASPECT_RATIOS)[number]['id']) => void;
  onDownload: () => void;
  suggestedFilter?: FilterKey;
}

export function EditingSuite({
  videoUrl,
  filter,
  onFilterChange,
  aspectRatio,
  onAspectRatioChange,
  onDownload,
  suggestedFilter
}: EditingSuiteProps) {
  const activeFilter = FILTER_PRESETS[filter];
  const aspect = ASPECT_RATIOS.find((item) => item.id === aspectRatio)?.value ?? 16 / 9;

  return (
    <motion.section
      aria-label="Cinematic editing"
      className="glass rounded-3xl p-4 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">Cinematic Suite</p>
          <p className="text-lg font-semibold">Refine your capture</p>
        </div>
        {suggestedFilter && suggestedFilter !== filter ? (
          <motion.button
            type="button"
            className="px-3 py-2 rounded-full text-xs font-semibold bg-accent/20 text-accent focus-ring"
            onClick={() => onFilterChange(suggestedFilter)}
            whileTap={{ scale: 0.95 }}
          >
            Apply AI look
          </motion.button>
        ) : null}
      </header>

      <div
        className="relative w-full bg-black/60 rounded-2xl overflow-hidden"
        style={{
          paddingTop: `${100 / aspect}%`
        }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: activeFilter.css }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
            <span className="text-sm">Record a clip to preview edits.</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 border border-white/10" />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
          <motion.button
            key={key}
            type="button"
            className={`px-4 py-2 rounded-full focus-ring transition-colors ${
              filter === key ? 'bg-accent text-black font-semibold' : 'bg-white/5 text-white/80'
            }`}
            onClick={() => onFilterChange(key as FilterKey)}
            whileTap={{ scale: 0.95 }}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <motion.button
            key={ratio.id}
            type="button"
            className={`rounded-full px-4 py-2 focus-ring ${
              aspectRatio === ratio.id ? 'bg-white/20' : 'bg-white/5 text-white/80'
            }`}
            onClick={() => onAspectRatioChange(ratio.id)}
            whileTap={{ scale: 0.95 }}
          >
            {ratio.label}
          </motion.button>
        ))}
      </div>

      <motion.button
        type="button"
        className="w-full rounded-2xl bg-accent text-black font-semibold py-3 focus-ring"
        onClick={onDownload}
        whileTap={{ scale: 0.98 }}
        disabled={!videoUrl}
      >
        Export clip
      </motion.button>
    </motion.section>
  );
}
