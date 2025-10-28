import { motion } from 'framer-motion';

interface VoiceStatusProps {
  supported: boolean;
  listening: boolean;
  error?: string;
}

export function VoiceStatus({ supported, listening, error }: VoiceStatusProps) {
  if (!supported) {
    return <p className="text-xs text-white/40">Voice commands unavailable in this browser.</p>;
  }

  return (
    <motion.div
      className="flex items-center gap-2 text-xs text-white/70"
      animate={{ opacity: listening ? 1 : 0.6 }}
    >
      <span className={`h-2 w-2 rounded-full ${listening ? 'bg-success animate-pulse' : 'bg-white/40'}`} />
      {error ? <span className="text-warning">{error}</span> : <span>{listening ? 'Listening for commands' : 'Voice ready'}</span>}
    </motion.div>
  );
}
