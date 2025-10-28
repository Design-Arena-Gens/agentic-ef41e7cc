import { motion } from 'framer-motion';
import type { CompositionHotspot } from '@/lib/sceneRecognition';

type OverlayMode = 'thirds' | 'golden';

interface CompositionOverlayProps {
  mode: OverlayMode;
  alignment: number;
  hotspot?: CompositionHotspot;
}

export function CompositionOverlay({ mode, alignment, hotspot }: CompositionOverlayProps) {
  const stroke = alignment > 0.65 ? '#36c2ff' : 'rgba(255, 255, 255, 0.25)';
  const glow = alignment > 0.75 ? '#36c2ff' : 'transparent';

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {mode === 'thirds' ? renderThirds(stroke, glow) : renderGolden(stroke, glow)}
      </svg>
      {hotspot ? (
        <motion.div
          aria-hidden
          className="absolute rounded-full border-2 border-accent/70"
          style={{
            width: `${24 + hotspot.strength * 24}px`,
            height: `${24 + hotspot.strength * 24}px`,
            left: `calc(${hotspot.x * 100}% - ${(12 + hotspot.strength * 12)}px)`,
            top: `calc(${hotspot.y * 100}% - ${(12 + hotspot.strength * 12)}px)`
          }}
          animate={{ opacity: hotspot.strength }}
          transition={{ ease: 'easeOut', duration: 0.25 }}
        />
      ) : null}
    </div>
  );
}

function renderThirds(stroke: string, glow: string) {
  const lines = [
    { x1: 33.33, y1: 0, x2: 33.33, y2: 100 },
    { x1: 66.66, y1: 0, x2: 66.66, y2: 100 },
    { x1: 0, y1: 33.33, x2: 100, y2: 33.33 },
    { x1: 0, y1: 66.66, x2: 100, y2: 66.66 }
  ];

  return (
    <>
      {lines.map((line, index) => (
        <line
          key={index}
          {...line}
          stroke={stroke}
          strokeWidth={0.4}
          strokeDasharray="0"
        />
      ))}
      {[33.33, 66.66].flatMap((x) =>
        [33.33, 66.66].map((y) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={2}
            stroke={glow}
            strokeWidth={0.6}
            fill="transparent"
          />
        ))
      )}
    </>
  );
}

function renderGolden(stroke: string, glow: string) {
  const ratio = 61.8;
  const complement = 38.2;
  return (
    <>
      <path
        d={`M0 ${ratio} C ${complement} ${ratio}, ${complement} 100, ${ratio} 100`}
        fill="none"
        stroke={stroke}
        strokeWidth={0.4}
      />
      <path
        d={`M ${ratio} 0 C ${ratio} ${complement}, 100 ${complement}, 100 ${ratio}`}
        fill="none"
        stroke={stroke}
        strokeWidth={0.4}
      />
      <path
        d={`M0 ${complement} C ${complement} ${complement}, ${complement} 0, ${ratio} 0`}
        fill="none"
        stroke={stroke}
        strokeWidth={0.4}
      />
      <path
        d={`M ${complement} 100 C ${complement} ${ratio}, 0 ${ratio}, 0 ${complement}`}
        fill="none"
        stroke={stroke}
        strokeWidth={0.4}
      />
      <circle cx={ratio} cy={complement} r={2.3} stroke={glow} strokeWidth={0.6} fill="transparent" />
      <circle cx={complement} cy={ratio} r={2.3} stroke={glow} strokeWidth={0.6} fill="transparent" />
    </>
  );
}
