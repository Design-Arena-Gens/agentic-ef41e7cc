import { motion } from 'framer-motion';
import type { SceneAnalysis } from '@/lib/sceneRecognition';

interface ProModePanelProps {
  analysis: SceneAnalysis | null;
  active: boolean;
}

export function ProModePanel({ analysis, active }: ProModePanelProps) {
  return (
    <motion.section
      aria-label="Pro mode suggestions"
      className="glass rounded-2xl p-4 space-y-4"
      animate={{ opacity: active ? 1 : 0.4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">Pro Mode</p>
          <p className="text-lg font-semibold">Intelligent Assist</p>
        </div>
        <motion.span
          className="px-3 py-1 rounded-full text-xs font-medium bg-white/10"
          animate={{ backgroundColor: active ? 'rgba(54,194,255,0.35)' : 'rgba(255,255,255,0.08)' }}
        >
          {analysis ? `${analysis.suggestion.scene.toUpperCase()} · ${(analysis.suggestion.confidence * 100).toFixed(0)}%` : 'Analyzing'}
        </motion.span>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {(['iso', 'aperture', 'shutterSpeed', 'whiteBalance'] as const).map((setting) => (
          <div key={setting} className="glass rounded-xl px-3 py-2">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/35">{setting.toUpperCase()}</p>
            <p className="text-base font-semibold">
              {analysis ? analysis.suggestion.recommended[setting] : 'Optimizing…'}
            </p>
          </div>
        ))}
      </div>

      <motion.ul className="space-y-2 text-sm leading-relaxed text-white/75">
        {(analysis?.suggestion.tips ?? ['Frame subject along guidelines', 'Maintain smooth camera motion']).map((tip, index) => (
          <li key={index} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 inline-block h-2 w-2 rounded-full bg-accent" />
            <span>{tip}</span>
          </li>
        ))}
      </motion.ul>
    </motion.section>
  );
}
