import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * On-device voice dictation via expo-speech-recognition (iOS Speech framework /
 * Android SpeechRecognizer). Loaded lazily so this is a safe no-op anywhere the
 * native module isn't present (web, or a build without it) — callers always keep
 * a typing fallback.
 *
 * Requires a native build (not Expo Go) plus the mic + speech-recognition
 * permissions (already declared in app.json). `supported` is false until then.
 */

type Subscription = { remove: () => void };

let cachedModule: any; // undefined = not tried, null = unavailable, object = the module
function speechModule(): any {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-speech-recognition');
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

export function useVoiceDictation(onTranscript: (text: string) => void) {
  const mod = speechModule();
  const engine = mod?.ExpoSpeechRecognitionModule ?? null;
  const supported = !!engine;
  const [listening, setListening] = useState(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    if (!engine) return;
    const subs: Subscription[] = [];
    try {
      subs.push(
        engine.addListener('result', (event: any) => {
          const transcript = event?.results?.[0]?.transcript;
          if (typeof transcript === 'string' && transcript.length) {
            onTranscriptRef.current(transcript);
          }
        })
      );
      subs.push(engine.addListener('end', () => setListening(false)));
      subs.push(engine.addListener('error', () => setListening(false)));
    } catch {
      // Event API unavailable — start/stop still work, transcript just won't stream.
    }
    return () => {
      subs.forEach((s) => {
        try {
          s.remove();
        } catch {
          /* noop */
        }
      });
    };
  }, [engine]);

  const start = useCallback(async () => {
    if (!engine) return false;
    try {
      const perm = await engine.requestPermissionsAsync();
      if (!perm?.granted) return false;
      engine.start({ lang: 'en-US', interimResults: true, continuous: false });
      setListening(true);
      return true;
    } catch {
      setListening(false);
      return false;
    }
  }, [engine]);

  const stop = useCallback(() => {
    if (!engine) return;
    try {
      engine.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, [engine]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, start, stop, toggle };
}
