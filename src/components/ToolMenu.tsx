"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { uiConfig } from "@/config/uiConfig";

type ToolItem = {
  key: string;
  label: string;
  description: string;
  href: string;
};

function getActiveToolKey(
  pathname: string,
  tools: readonly ToolItem[],
): ToolItem["key"] | null {
  // 按 href 前缀匹配：/sql-convert/* 也会被识别为 sql-convert
  const match = tools.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`));
  return match?.key ?? null;
}

export function ToolMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const tools = useMemo(() => {
    // uiConfig.toolMenuRoutes 是 readonly（as const），这里转换成只读数组即可
    return (uiConfig.toolMenuRoutes ?? []) as readonly ToolItem[];
  }, []);
  const activeKey = getActiveToolKey(pathname, tools);

  const activeTool = useMemo(
    () => tools.find((t) => t.key === activeKey) ?? null,
    [activeKey, tools],
  );

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 text-sm text-slate-700 dark:text-slate-300 shadow-sm hover:border-blue-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon icon="mdi:apps" width={18} height={18} />
        <span className="hidden sm:inline">
          {activeTool ? activeTool.label : "工具"}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="text-slate-500 dark:text-slate-400"
        >
          <Icon icon="mdi:chevron-down" width={18} height={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="tool-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-lg z-50"
            role="menu"
            aria-label="工具菜单"
          >
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border">
              选择工具
            </div>
            <div className="p-2">
              {tools.map((t) => {
                const isActive = t.key === activeKey;
                return (
                  <motion.button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) router.push(t.href);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 700, damping: 40 }}
                    className={[
                      "w-full text-left rounded-md px-3 py-2",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "hover:bg-slate-50 dark:hover:bg-dark-surface text-slate-800 dark:text-slate-200",
                    ].join(" ")}
                    role="menuitem"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.description}</div>
                      </div>
                      <div className="pt-0.5">
                        {isActive ? (
                          <motion.span
                            layoutId="tool-menu-active"
                            className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300"
                          >
                            当前
                          </motion.span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-dark-border px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            打开
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

