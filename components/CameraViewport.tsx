import { motion } from 'framer-motion';
import { CompositionOverlay } from './CompositionOverlay';
import type { CompositionHotspot, SceneAnalysis } from '@/lib/sceneRecognition';

type OverlayMode = 'thirds' | 'golden';

interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayMode: OverlayMode;
  onOverlayModeChange: (mode: OverlayMode) => void;
  alignment: number;
  alignmentScores: { thirds: number; golden: number };
  hotspot?: CompositionHotspot;
  isRecording: boolean;
  analysis: SceneAnalysis | null;
  stabilizationEnabled: boolean;
  orientationTransform: React.CSSProperties;
  onCaptureFrame: () => void;
}

export function CameraViewport({
  videoRef,
  overlayMode,
  onOverlayModeChange,
  alignment,
  alignmentScores,
  hotspot,
  isRecording,
  analysis,
  stabilizationEnabled,
  orientationTransform,
  onCaptureFrame
}: CameraViewportProps) {
  return (
    <div className="relative aspect-[9/16] w-full max-w-xl mx-auto overflow-hidden rounded-[2.5rem] border border-white/10 shadow-glow">
      <motion.div
        className="absolute inset-0"
        style={orientationTransform}
        animate={{ scale: stabilizationEnabled ? 1.02 : 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          autoPlay
          muted
        />
        <CompositionOverlay mode={overlayMode} alignment={alignment} hotspot={hotspot} />
        <StatusHeader
          overlayMode={overlayMode}
          onOverlayModeChange={onOverlayModeChange}
          alignment={alignment}
          alignmentScores={alignmentScores}
          analysis={analysis}
          stabilizationEnabled={stabilizationEnabled}
        />
        <CaptureButton isRecording={isRecording} onCaptureFrame={onCaptureFrame} />
      </motion.div>
    </div>
  );
}

interface StatusHeaderProps {
  overlayMode: OverlayMode;
  onOverlayModeChange: (mode: OverlayMode) => void;
  alignment: number;
  analysis: SceneAnalysis | null;
  stabilizationEnabled: boolean;
}

interface StatusHeaderProps {
  overlayMode: OverlayMode;
  onOverlayModeChange: (mode: OverlayMode) => void;
  alignment: number;
  alignmentScores: { thirds: number; golden: number };
  analysis: SceneAnalysis | null;
  stabilizationEnabled: boolean;
}

function StatusHeader({
  overlayMode,
  onOverlayModeChange,
  alignment,
  alignmentScores,
  analysis,
  stabilizationEnabled
}: StatusHeaderProps) {
  const alignmentPercent = Math.round(alignment * 100);
  return (
    <div className="absolute inset-x-0 top-0 p-4 flex flex-col gap-3">
      <div className="glass rounded-2xl px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-[0.3em] text-white/50">
            {analysis?.suggestion?.scene ? analysis.suggestion.scene.toUpperCase() : 'SCENE'}
          </span>
          <span className="text-white/60">{alignmentPercent}% aligned</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`focus-ring rounded-full px-3 py-1 text-xs ${overlayMode === 'thirds' ? 'bg-accent text-black' : 'bg-white/10 text-white/70'}`}
            onClick={() => onOverlayModeChange('thirds')}
          >
            Rule of Thirds · {(alignmentScores.thirds * 100).toFixed(0)}%
          </button>
          <button
            type="button"
            className={`focus-ring rounded-full px-3 py-1 text-xs ${overlayMode === 'golden' ? 'bg-accent text-black' : 'bg-white/10 text-white/70'}`}
            onClick={() => onOverlayModeChange('golden')}
          >
            Golden Ratio · {(alignmentScores.golden * 100).toFixed(0)}%
          </button>
        </div>
      </div>
      <motion.div
        className="glass rounded-full h-2 overflow-hidden"
        initial={{ width: '100%' }}
      >
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${Math.max(10, alignmentPercent)}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        />
      </motion.div>
      {analysis?.suggestion ? (
        <div className="glass rounded-2xl px-4 py-2 text-xs flex items-center justify-between text-white/70">
          <span>ISO {analysis.suggestion.recommended.iso}</span>
          <span>{analysis.suggestion.recommended.aperture}</span>
          <span>{analysis.suggestion.recommended.shutterSpeed}</span>
          <span>{analysis.suggestion.recommended.whiteBalance}</span>
          {stabilizationEnabled ? <span className="text-success">Stabilized</span> : <span className="text-white/40">Stabilization ready</span>}
        </div>
      ) : null}
    </div>
  );
}

function CaptureButton({ isRecording, onCaptureFrame }: { isRecording: boolean; onCaptureFrame: () => void }) {
  return (
    <div className="absolute bottom-6 inset-x-0 flex justify-center">
      <motion.button
        type="button"
        className={`h-16 w-16 rounded-full border-[6px] transition-colors focus-ring ${
          isRecording ? 'border-red-500 bg-red-500/20' : 'border-white/60 bg-white/10'
        }`}
        onClick={onCaptureFrame}
        whileTap={{ scale: 0.9 }}
        aria-label={isRecording ? 'Stop recording' : 'Capture frame'}
      />
    </div>
  );
}
