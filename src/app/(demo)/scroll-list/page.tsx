"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import rawData from "@/app/(demo)/scroll-list/data.json";

type RawBin = {
  whseBin_BinNum: string | null;
  whseBin_WarehouseCode: string | null;
  partNum: string | null;
  onhandQty: string | null;
  ium: string | null;
};

type Bin = {
  code: string;
  warehouseCode: string;
  partNum: string;
  onhandQty: number | null;
  ium: string;
};

const SCROLL_POSITION_KEY = "warehouse-scroll-position";

const processData = (data: RawBin[]): Bin[] => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((bin) => ({
    code: bin.whseBin_BinNum ?? "",
    warehouseCode: bin.whseBin_WarehouseCode ?? "",
    partNum: bin.partNum ?? "",
    onhandQty: bin.onhandQty ? Number.parseFloat(bin.onhandQty) : null,
    ium: bin.ium ?? "",
  }));
};

export default function ScrollListPage() {
  const bins = useMemo(() => processData(rawData as RawBin[]), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition !== null) {
        const position = Number.parseFloat(savedPosition);
        if (!Number.isNaN(position) && position >= 0) {
          container.scrollTop = position;
        }
      }
    } catch {
      // ignore storage access errors
    }

    const onScroll = () => {
      try {
        sessionStorage.setItem(SCROLL_POSITION_KEY, String(container.scrollTop));
      } catch {
        // ignore storage access errors
      }
    };

    container.addEventListener("scroll", onScroll);

    const timeoutId = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        const target = containerRef.current;
        if (!target || paused) return;

        const maxScroll = target.scrollHeight - target.clientHeight;
        if (maxScroll <= 0) return;

        if (target.scrollTop >= maxScroll - 1) {
          target.scrollTop = 0;
        } else {
          target.scrollTop += 1;
        }

        try {
          sessionStorage.setItem(SCROLL_POSITION_KEY, String(target.scrollTop));
        } catch {
          // ignore storage access errors
        }
      }, 20);
    }, 500);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.clearTimeout(timeoutId);
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused]);

  if (bins.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 0",
          fontSize: 28,
          color: "#8a8a8a",
          height: "100%",
        }}
      >
        No data available.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          padding: 48,
          backgroundColor: "#ffffff",
          borderRadius: 16,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <div style={{ flexShrink: 0, marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: 48, fontWeight: 700, color: "#2d2d2d", margin: 0 }}>
              Warehouse location map
            </h2>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#556ea7",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="m15 19.923l-6-2.1l-5 1.94V5.782l5-1.704l6 2.1l5-1.94v14.04zm-.5-1.22v-11.7l-5-1.745v11.7zm1 0L19 17.55V5.7l-3.5 1.304zM5 18.3l3.5-1.342v-11.7L5 6.45zM15.5 7.004v11.7zm-7-1.746v11.7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            scrollBehavior: "smooth",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 32,
            }}
          >
            {bins.map((item, index) => {
              const hasStock = Boolean(item.partNum && item.onhandQty);

              return (
                <div
                  key={`${item.code}-${item.partNum}-${index}`}
                  style={{
                    backgroundColor: hasStock ? "#E8EDF7" : "#f8f9fa",
                    borderRadius: 16,
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    padding: 32,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 200,
                    gap: 16,
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 600, color: "#2d2d2d" }}>{item.code}</div>
                  {item.warehouseCode ? (
                    <div
                      style={{
                        fontSize: 20,
                        color: "#6a6a6a",
                        marginTop: 4,
                        textAlign: "center",
                        fontWeight: 400,
                      }}
                    >
                      {item.warehouseCode}
                    </div>
                  ) : null}
                  {item.partNum ? (
                    <div
                      style={{
                        fontSize: 24,
                        color: "#4a4a4a",
                        marginTop: 8,
                        textAlign: "center",
                        wordBreak: "break-all",
                        fontWeight: 500,
                      }}
                    >
                      {item.partNum}
                    </div>
                  ) : null}
                  {item.onhandQty ? (
                    <div style={{ fontSize: 36, fontWeight: 600, color: "#2d2d2d" }}>
                      {item.onhandQty.toLocaleString()} {item.ium}
                    </div>
                  ) : (
                    <div style={{ fontSize: 28, color: "#8a8a8a" }}>Vacant</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}