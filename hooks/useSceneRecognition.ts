import { useEffect, useRef, useState } from 'react';
import {
  GOLDEN_RATIO,
  analyzeFrame,
  classifyScene,
  mergeFaceConfidence,
  type SceneAnalysis,
  type SceneMetrics
} from '@/lib/sceneRecognition';

type OverlayMode = 'thirds' | 'golden';

interface AlignmentScores {
  thirds: number;
  golden: number;
}

const GOLDEN_RATIO_COMPLEMENT = 1 - GOLDEN_RATIO;

export function useSceneRecognition(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean,
  overlayMode: OverlayMode
) {
  const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
  const [alignmentScores, setAlignmentScores] = useState<AlignmentScores>({ thirds: 0, golden: 0 });
  const frameRequestRef = useRef<number>();
  const analyzerRef = useRef<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } | null>(null);
  const previousBrightnessRef = useRef<number>(0.4);

  useEffect(() => {
    if (!enabled) {
      setAnalysis(null);
      setAlignmentScores({ thirds: 0, golden: 0 });
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      return;
    }

    const analyze = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        frameRequestRef.current = requestAnimationFrame(analyze);
        return;
      }

      const width = 320;
      const height = Math.floor((video.videoHeight / video.videoWidth) * width) || 180;

      if (!analyzerRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        analyzerRef.current = { canvas, ctx };
      }

      const { canvas, ctx } = analyzerRef.current;
      if (!ctx) {
        frameRequestRef.current = requestAnimationFrame(analyze);
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      const { metrics } = analyzeFrame(imageData.data, width, height, {
        previousBrightness: previousBrightnessRef.current
      });

      previousBrightnessRef.current = metrics.brightness;

      const faceScore = await detectFaces(canvas);
      const mergedMetrics: SceneMetrics = mergeFaceConfidence(metrics, faceScore);

      const suggestion = classifyScene(mergedMetrics);
      setAnalysis({ metrics: mergedMetrics, suggestion });
      setAlignmentScores({
        thirds: calculateThirdsAlignment(mergedMetrics.hotspot),
        golden: calculateGoldenAlignment(mergedMetrics.hotspot)
      });

      frameRequestRef.current = requestAnimationFrame(analyze);
    };

    frameRequestRef.current = requestAnimationFrame(analyze);

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [enabled, overlayMode, videoRef]);

  return {
    analysis,
    alignmentScores,
    activeAlignment: overlayMode === 'thirds' ? alignmentScores.thirds : alignmentScores.golden
  };
}

async function detectFaces(source: CanvasImageSource): Promise<number> {
  if (typeof window === 'undefined') return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FaceDetectorConstructor = (window as any).FaceDetector;
  if (!FaceDetectorConstructor) {
    return 0;
  }

  try {
    const detector = new FaceDetectorConstructor({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(source);
    if (!faces || !faces.length) return 0;
    const totalArea = faces.reduce((acc: number, face: DOMRectReadOnly & { width: number; height: number }) => {
      return acc + face.width * face.height;
    }, 0);
    const canvasArea = (source as HTMLCanvasElement).width * (source as HTMLCanvasElement).height;
    return Math.min(1, (faces.length * 0.2) + totalArea / Math.max(canvasArea, 1));
  } catch (error) {
    console.warn('Face detection unavailable', error);
    return 0;
  }
}

function calculateThirdsAlignment(hotspot?: { x: number; y: number }): number {
  if (!hotspot) return 0;
  const thirds = [1 / 3, 2 / 3];
  const distances = thirds
    .map((t) => distance(hotspot.x, hotspot.y, t, t))
    .concat(thirds.map((t) => distance(hotspot.x, hotspot.y, t, 1 - t)));
  const minDistance = Math.min(...distances);
  return Number(Math.max(0, 1 - minDistance * 3).toFixed(3));
}

function calculateGoldenAlignment(hotspot?: { x: number; y: number }): number {
  if (!hotspot) return 0;
  const points = [
    [GOLDEN_RATIO, GOLDEN_RATIO],
    [GOLDEN_RATIO, GOLDEN_RATIO_COMPLEMENT],
    [GOLDEN_RATIO_COMPLEMENT, GOLDEN_RATIO],
    [GOLDEN_RATIO_COMPLEMENT, GOLDEN_RATIO_COMPLEMENT]
  ];
  const distances = points.map(([x, y]) => distance(hotspot.x, hotspot.y, x, y));
  const minDistance = Math.min(...distances);
  return Number(Math.max(0, 1 - minDistance * 3.2).toFixed(3));
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}
