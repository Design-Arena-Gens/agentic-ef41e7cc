"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CameraViewport } from './CameraViewport';
import { ProModePanel } from './ProModePanel';
import { EditingSuite } from './EditingSuite';
import { LayoutSelector } from './LayoutSelector';
import { VoiceStatus } from './VoiceStatus';
import { AudioLevelMeter } from './AudioLevelMeter';
import { useSceneRecognition } from '@/hooks/useSceneRecognition';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useHaptics } from '@/hooks/useHaptics';
import { useAudioMeter } from '@/hooks/useAudioMeter';
import { useOrientationStabilizer } from '@/hooks/useOrientationStabilizer';
import type { FilterKey } from '@/lib/editingPresets';

type OverlayMode = 'thirds' | 'golden';
type ControlLayout = 'right' | 'left' | 'compact';

export function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('thirds');
  const [proMode, setProMode] = useState(true);
  const [stabilizationEnabled, setStabilizationEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('neutral');
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '16:9' | '1:1'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [buttonLayout, setButtonLayout] = useState<ControlLayout>('right');
  const { vibrate, supported: hapticSupported } = useHaptics();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());
  }, [fontScale]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (highContrast) {
      document.body.setAttribute('data-high-contrast', 'true');
    } else {
      document.body.removeAttribute('data-high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Media devices API not supported in this browser.');
          return;
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        if (!mounted) return;
        setStream(mediaStream);
        if (videoRef.current) {
          // eslint-disable-next-line no-param-reassign
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Unable to access camera or microphone. Please grant permissions and refresh.');
        console.error(err);
      }
    };

    initCamera();
    return () => {
      mounted = false;
      setStream((prev) => {
        prev?.getTracks().forEach((track) => track.stop());
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      // eslint-disable-next-line no-param-reassign
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const orientationTransform = useOrientationStabilizer(stabilizationEnabled);

  const recognitionEnabled = Boolean(stream) && !isRecording;
  const { analysis, alignmentScores, activeAlignment } = useSceneRecognition(videoRef, recognitionEnabled, overlayMode);

  const audioLevel = useAudioMeter(stream, Boolean(stream));

  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl]
  );

  const handleRecordToggle = useCallback(() => {
    if (!stream) return;

    if (!isRecording) {
      const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedChunksRef.current = [];
        const url = URL.createObjectURL(blob);
        setVideoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } else {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording, stream]);

  const voiceCommands = useMemo(
    () => [
      {
        keywords: ['start recording', 'begin recording', 'record video'],
        action: () => !isRecording && handleRecordToggle()
      },
      {
        keywords: ['stop recording', 'end recording'],
        action: () => isRecording && handleRecordToggle()
      },
      {
        keywords: ['enable pro mode', 'pro mode on'],
        action: () => setProMode(true)
      },
      {
        keywords: ['disable pro mode', 'pro mode off'],
        action: () => setProMode(false)
      },
      {
        keywords: ['golden ratio'],
        action: () => setOverlayMode('golden')
      },
      {
        keywords: ['rule of thirds'],
        action: () => setOverlayMode('thirds')
      },
      {
        keywords: ['high contrast'],
        action: () => setHighContrast(true)
      },
      {
        keywords: ['normal contrast', 'default contrast'],
        action: () => setHighContrast(false)
      },
      {
        keywords: ['increase font', 'bigger text'],
        action: () => setFontScale((prev) => Math.min(1.4, prev + 0.1))
      },
      {
        keywords: ['decrease font', 'smaller text'],
        action: () => setFontScale((prev) => Math.max(0.8, prev - 0.1))
      },
      {
        keywords: ['stabilization on'],
        action: () => setStabilizationEnabled(true)
      },
      {
        keywords: ['stabilization off'],
        action: () => setStabilizationEnabled(false)
      },
      {
        keywords: ['apply ai look', 'apply filter'],
        action: () => analysis?.suggestion && setFilter(analysis.suggestion.suggestedFilter as FilterKey)
      }
    ],
    [analysis?.suggestion, handleRecordToggle, isRecording]
  );

  const voiceState = useVoiceCommands(voiceEnabled, voiceCommands);

  const previousAlignmentRef = useRef(0);
  useEffect(() => {
    if (!hapticSupported) return;
    if (activeAlignment > 0.82 && previousAlignmentRef.current <= 0.82) {
      vibrate(40);
    }
    previousAlignmentRef.current = activeAlignment;
  }, [activeAlignment, hapticSupported, vibrate]);

  const suggestedFilter = analysis?.suggestion?.suggestedFilter as FilterKey | undefined;
  useEffect(() => {
    if (!suggestedFilter) return;
    if (!proMode) return;
    setFilter((current) => (current === 'neutral' ? suggestedFilter : current));
  }, [suggestedFilter, proMode]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const anchor = document.createElement('a');
    anchor.href = videoUrl;
    anchor.download = 'lumina-clip.webm';
    anchor.click();
  }, [videoUrl]);

  const handleCaptureButton = useCallback(() => {
    handleRecordToggle();
  }, [handleRecordToggle]);

  const handleFontScaleChange = (value: number) => {
    setFontScale(value);
  };

  const controlAlignment = getControlAlignment(buttonLayout);
  const controlAlignmentClass =
    controlAlignment === 'start' ? 'justify-start' : controlAlignment === 'center' ? 'justify-center' : 'justify-end';

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 md:grid md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {error ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          <CameraViewport
            videoRef={videoRef}
            overlayMode={overlayMode}
            onOverlayModeChange={setOverlayMode}
            alignment={activeAlignment}
            alignmentScores={alignmentScores}
            hotspot={analysis?.metrics.hotspot}
            isRecording={isRecording}
            analysis={analysis ?? null}
            stabilizationEnabled={stabilizationEnabled}
            orientationTransform={orientationTransform}
            onCaptureFrame={handleCaptureButton}
          />
          <motion.div
            className={`glass rounded-3xl px-4 py-4 flex flex-wrap items-center gap-4 ${controlAlignmentClass}`}
            layout
          >
            <motion.button
              type="button"
              className={`focus-ring rounded-full px-5 py-2 font-semibold text-sm transition-colors ${
                isRecording ? 'bg-red-500 text-white' : 'bg-accent text-black'
              }`}
              onClick={handleRecordToggle}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </motion.button>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/40 bg-transparent"
                  checked={proMode}
                  onChange={(event) => setProMode(event.target.checked)}
                />
                Pro Mode
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/40 bg-transparent"
                  checked={stabilizationEnabled}
                  onChange={(event) => setStabilizationEnabled(event.target.checked)}
                />
                Stabilization
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/40 bg-transparent"
                  checked={voiceEnabled}
                  onChange={(event) => setVoiceEnabled(event.target.checked)}
                />
                Voice
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/40 bg-transparent"
                  checked={highContrast}
                  onChange={(event) => setHighContrast(event.target.checked)}
                />
                High contrast
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="font-scale">UI Scale</label>
              <input
                id="font-scale"
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={fontScale}
                onChange={(event) => handleFontScaleChange(Number(event.target.value))}
                className="w-32"
              />
              <span>{(fontScale * 100).toFixed(0)}%</span>
            </div>
            <AudioLevelMeter level={audioLevel} />
          </motion.div>
        </div>
        <div className="space-y-6">
          <ProModePanel analysis={analysis ?? null} active={proMode} />
          <VoiceStatus {...voiceState} />
          <LayoutSelector layout={buttonLayout} onChange={setButtonLayout} />
          <EditingSuite
            videoUrl={videoUrl}
            filter={filter}
            onFilterChange={setFilter}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            onDownload={handleDownload}
            suggestedFilter={suggestedFilter}
          />
        </div>
      </div>
    </main>
  );

  function getControlAlignment(layout: ControlLayout) {
    switch (layout) {
      case 'left':
        return 'start';
      case 'compact':
        return 'center';
      default:
        return 'end';
    }
  }
}
