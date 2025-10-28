import { useEffect, useRef, useState } from 'react';

export interface VoiceCommand {
  keywords: string[];
  action: () => void;
}

interface VoiceCommandState {
  supported: boolean;
  listening: boolean;
  error?: string;
}

export function useVoiceCommands(enabled: boolean, commands: VoiceCommand[]): VoiceCommandState {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<VoiceCommandState>({
    supported: false,
    listening: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor =
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setState({ supported: false, listening: false, error: 'Voice recognition not supported in this browser.' });
      return;
    }

    recognitionRef.current = new SpeechRecognitionConstructor();
    recognitionRef.current.continuous = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .toLowerCase();
      commands.forEach((command) => {
        if (command.keywords.some((keyword) => transcript.includes(keyword))) {
          command.action();
        }
      });
    };

    recognitionRef.current.onerror = (event) => {
      setState((prev) => ({ ...prev, error: event.error, listening: false }));
    };

    recognitionRef.current.onend = () => {
      setState((prev) => ({ ...prev, listening: false }));
      if (enabled) {
        try {
          recognitionRef.current?.start();
          setState((prev) => ({ ...prev, listening: true }));
        } catch (error) {
          console.warn('Speech recognition restart failed', error);
        }
      }
    };

    setState({ supported: true, listening: false });

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (enabled) {
      try {
        recognition.start();
        setState((prev) => ({ ...prev, listening: true }));
      } catch (error) {
        console.warn('Speech recognition failed to start', error);
      }
    } else {
      recognition.stop();
    }
  }, [enabled]);

  return state;
}
