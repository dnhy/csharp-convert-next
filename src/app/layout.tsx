import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopProgressBar } from "@/components/TopProgressBar";
import { PageTransition } from "@/components/PageTransition";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { uiConfig } from "@/config/uiConfig";
import { getSiteUrl } from "@/lib/siteUrl";
import { Providers } from "@/components/providers";
import ModalStack from "@/components/ui/modal/ModalStack";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
      <body>
        <Providers>
          <TopProgressBar />
          <ModalStack />
          {uiConfig.enableLoadingOverlay ? <LoadingOverlay /> : null}
          {uiConfig.enablePageBounceTransition ? (
            <PageTransition>{children}</PageTransition>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
