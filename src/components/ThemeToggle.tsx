"use client";

import { useAtom } from "jotai";
import { Icon } from "@iconify/react";
import { themeAtom, type ThemeMode } from "@/atoms/theme";

const config: Record<
  ThemeMode,
  { icon: string; label: string; next: ThemeMode }
> = {
  light: {
    icon: "mdi:weather-sunny",
    label: "浅色模式",
    next: "dark",
  },
  dark: {
    icon: "mdi:weather-night",
    label: "深色模式",
    next: "system",
  },
  system: {
    icon: "mdi:monitor",
    label: "跟随系统",
    next: "light",
  },
};

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  const { icon, label, next } = config[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`当前：${label} — 点击切换`}
      className="fixed bottom-6 right-6 z-[1000] flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
    >
      <Icon
        icon={icon}
        width={22}
        height={22}
        className="text-slate-600 dark:text-slate-300"
      />
    </button>
  );
}
