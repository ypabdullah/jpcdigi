
import { useCallback, useRef } from 'react';

export function useSound(soundSrc: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundSrc);
    }
    audioRef.current.play().catch(error => {
      // Autoplay was prevented, or another error occurred.
      // You might want to log this or handle it gracefully.
      console.warn(`Could not play sound ${soundSrc}:`, error);
    });
  }, [soundSrc]);

  return playSound;
}
