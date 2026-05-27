"use client";

import { useState, useRef, useCallback } from "react";

export function useCompletionTimer() {
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (startTimeRef.current !== null) return; // already started
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (startTimeRef.current) {
      const final = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(final);
      return final;
    }
    return seconds;
  }, [seconds]);

  return { seconds, start, stop };
}
