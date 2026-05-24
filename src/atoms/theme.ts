"use client";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export const themeAtom = atomWithStorage<ThemeMode>("theme-mode", "system");

export function useIsDark() {
  const [theme] = useAtom(themeAtom);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    setIsDark(theme === "dark");
  }, [theme]);

  return isDark;
}
