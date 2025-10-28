import { useEffect, useRef, useState } from 'react';

const MAX_OFFSET = 12;

export function useOrientationStabilizer(enabled: boolean) {
  const [transformStyle, setTransformStyle] = useState<React.CSSProperties>({
    transform: 'translate3d(0,0,0)'
  });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setTransformStyle({ transform: 'translate3d(0,0,0)' });
      return;
    }

    let animationFrame: number;

    const requestPermissionIfNeeded = async () => {
      const deviceOrientation = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState>;
      };
      if (typeof deviceOrientation?.requestPermission === 'function') {
        try {
          const permission = await deviceOrientation.requestPermission();
          if (permission !== 'granted') {
            console.warn('Device orientation permission denied');
          }
        } catch (error) {
          console.warn('Orientation permission error', error);
        }
      }
    };

    requestPermissionIfNeeded();

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0; // front-back tilt
      const gamma = event.gamma ?? 0; // left-right tilt

      const offsetX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, -gamma / 3));
      const offsetY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, beta / 3));

      targetRef.current = {
        x: lerp(targetRef.current.x, offsetX, 0.1),
        y: lerp(targetRef.current.y, offsetY, 0.1)
      };
    };

    const updateTransform = () => {
      const { x, y } = targetRef.current;
      setTransformStyle({
        transform: `translate3d(${x}px, ${y}px, 0)`
      });
      animationFrame = requestAnimationFrame(updateTransform);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    animationFrame = requestAnimationFrame(updateTransform);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(animationFrame);
      setTransformStyle({ transform: 'translate3d(0,0,0)' });
    };
  }, [enabled]);

  return transformStyle;
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}
