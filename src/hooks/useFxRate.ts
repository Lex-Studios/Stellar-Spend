"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL = 30_000;

export function useFxRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchRate() {
    if (document.visibilityState === "hidden") return;
    try {
      const res = await fetch("/api/offramp/rate", { cache: "no-store" });
      if (!res.ok) return;
      const { rate: r } = await res.json();
      if (typeof r === "number" && r > 0) {
        setRate(r);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    fetchRate();
    timerRef.current = setInterval(fetchRate, INTERVAL);

    function onVisibility() {
      if (document.visibilityState === "visible") fetchRate();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { rate, flash };
}
