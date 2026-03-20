import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopProgressBar } from "@/components/TopProgressBar";
import { PageTransition } from "@/components/PageTransition";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { uiConfig } from "@/config/uiConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "C# Script Converter",
  description: "C# script automatically converts for easier debugging",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TopProgressBar />
        {uiConfig.enableLoadingOverlay ? <LoadingOverlay /> : null}
        {uiConfig.enablePageBounceTransition ? (
          <PageTransition>{children}</PageTransition>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
