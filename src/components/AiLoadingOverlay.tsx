"use client";

import React from "react";
import { createPortal } from "react-dom";

export function AiLoadingOverlay() {
  return createPortal(
    <div className="ai-loading-overlay">
      <div className="ai-loading-box">
        <div className="ai-loading-ring">
          <div className="ai-loading-dot" />
        </div>
        <p className="ai-loading-text">正在转换中...</p>
      </div>
    </div>,
    document.body,
  );
}
