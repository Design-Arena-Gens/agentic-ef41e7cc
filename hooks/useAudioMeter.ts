import { useEffect, useRef, useState } from 'react';

export function useAudioMeter(stream: MediaStream | null, enabled: boolean) {
  const [level, setLevel] = useState(0);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!enabled || !stream) {
      setLevel(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const value = data[i] - 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / data.length);
      const normalized = Math.min(1, Number((rms / 64).toFixed(3)));
      setLevel(normalized);
      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationRef.current ?? 0);
      analyser.disconnect();
      source.disconnect();
      audioContext.close();
      analyserRef.current = null;
    };
  }, [stream, enabled]);

  return level;
}
