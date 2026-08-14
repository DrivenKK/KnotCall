"use client";

import { useEffect, useRef } from "react";

export function useActiveSpeaker(
  stream: MediaStream | null,
  onSpeakingChange: (speaking: boolean) => void,
  threshold = 15
) {
  const rafRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const callbackRef = useRef(onSpeakingChange);

  callbackRef.current = onSpeakingChange;

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      if (speakingRef.current) {
        speakingRef.current = false;
        callbackRef.current(false);
      }
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        audioContext = new AudioContext();
        await audioContext.resume();
        if (cancelled) return;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const check = () => {
          if (cancelled || !analyser) return;
          analyser.getByteFrequencyData(data);
          const average = data.reduce((sum, value) => sum + value, 0) / data.length;
          const audioTrack = stream.getAudioTracks()[0];
          const speaking = average > threshold && !!audioTrack?.enabled;

          if (speaking !== speakingRef.current) {
            speakingRef.current = speaking;
            callbackRef.current(speaking);
          }

          rafRef.current = requestAnimationFrame(check);
        };

        rafRef.current = requestAnimationFrame(check);
      } catch {
        callbackRef.current(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source?.disconnect();
      analyser?.disconnect();
      void audioContext?.close();
      speakingRef.current = false;
    };
  }, [stream, threshold]);
}
