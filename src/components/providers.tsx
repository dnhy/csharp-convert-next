"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { jotaiStore } from "@/components/jotaiStore";

interface ProvidersProps {
  children: ReactNode;
}

const JotaiDevTools =
  process.env.NODE_ENV !== "production"
    ? dynamic(
        () =>
          import("@/components/JotaiDevTools").then((mod) => ({
            default: mod.DevTools,
          })),
        { ssr: false }
      )
    : null;

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={jotaiStore}>
      {children}
      {JotaiDevTools ? <JotaiDevTools store={jotaiStore} /> : null}
    </Provider>
  );
};
