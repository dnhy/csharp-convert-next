"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * 轻量顶部进度条（App Router 无 router.events，因此用 pathname 变更模拟路由切换）
 * 体验目标：切换时快速到 30%，缓慢推进到 90%，稳定后收尾到 100% 并淡出。
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    // 触发一次“加载”
    clearTimers();
    setVisible(true);
    setProgress(0);

    // 迅速到 30%
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(30);
      }, 30),
    );

    // 缓慢推进到 90%
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(60);
      }, 220),
    );
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(80);
      }, 520),
    );
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(90);
      }, 900),
    );

    // 收尾：到 100% 后淡出
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(100);
      }, 1100),
    );
    timersRef.current.push(
      window.setTimeout(() => {
        setVisible(false);
      }, 1400),
    );
    timersRef.current.push(
      window.setTimeout(() => {
        setProgress(0);
      }, 1700),
    );

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[2000] h-[3px] w-full bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
        initial={{ width: "0%", opacity: 1 }}
        animate={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
        transition={{
          width: { type: "tween", ease: "easeOut", duration: 0.25 },
          opacity: { type: "tween", ease: "easeOut", duration: 0.25 },
        }}
      />
    </div>
  );
}

