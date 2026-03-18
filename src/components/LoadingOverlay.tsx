"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";

export function LoadingOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();
    // 避免在 effect 里同步 setState（部分规则会报 cascading renders）
    timersRef.current.push(
      window.setTimeout(() => {
        setVisible(true);
      }, 0),
    );

    // 遮罩展示一小段时间，提供“加载中”的视觉反馈
    timersRef.current.push(
      window.setTimeout(() => {
        setVisible(false);
      }, 650),
    );

    return () => clearTimers();
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          className="fixed inset-0 z-[1999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
          aria-label="页面加载中"
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" />

          {/* cute star */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            <motion.div
              animate={{
                rotate: 360,
                y: [0, -10, 0],
                scale: [1, 1.06, 1],
              }}
              transition={{
                rotate: { duration: 1.1, ease: "linear", repeat: Infinity },
                y: { duration: 0.55, ease: "easeInOut", repeat: Infinity },
                scale: { duration: 0.55, ease: "easeInOut", repeat: Infinity },
              }}
              className="drop-shadow-[0_10px_22px_rgba(245,158,11,0.35)]"
            >
              <Icon
                icon="material-symbols:star-rounded"
                width={56}
                height={56}
                className="text-amber-400"
                style={{
                  filter:
                    "drop-shadow(0 2px 0 rgba(255,255,255,0.35)) drop-shadow(0 10px 20px rgba(245,158,11,0.22))",
                }}
              />
            </motion.div>

            <motion.div
              className="text-xs font-semibold text-slate-600"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
            >
              加载中...
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

