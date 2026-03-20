import type { Metadata } from "next";
import React from "react";
import { ToolMenu } from "@/components/ToolMenu";
import { uiConfig } from "@/config/uiConfig";

export type ToolPageConfig = {
  /** 页面主标题（h1） */
  h1: string;
  /** 主说明（header 第一段） */
  lead: React.ReactNode;
  /** 补充说明（header 第二段，可选） */
  subLead?: React.ReactNode;
  /** canonical/url 路径，例如 /sql-convert */
  path: string;
  /** 元数据 title */
  metaTitle: string;
  /** 元数据 description */
  metaDescription: string;
  /** OG/Twitter 的简短 title/description（可与 meta 相同或更短） */
  shareTitle: string;
  shareDescription: string;
  /** JSON-LD SoftwareApplication 信息 */
  jsonLd: {
    name: string;
    description: string;
  };
};

export function createToolMetadata(cfg: ToolPageConfig): Metadata {
  const ogImagePath = `${cfg.path}/opengraph-image`;
  return {
    title: cfg.metaTitle,
    description: cfg.metaDescription,
    alternates: { canonical: cfg.path },
    openGraph: {
      title: cfg.shareTitle,
      description: cfg.shareDescription,
      url: cfg.path,
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: cfg.shareTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cfg.shareTitle,
      description: cfg.shareDescription,
      images: [ogImagePath],
    },
  };
}

function JsonLd({ cfg }: { cfg: ToolPageConfig }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: cfg.jsonLd.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: cfg.jsonLd.description,
    url: cfg.path,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function createToolPage(cfg: ToolPageConfig, Content: React.ReactNode) {
  return function ToolPage() {
    return (
      <div className="min-h-screen bg-slate-100 py-4 px-2">
        <div className="w-full rounded-none border-b border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-6">
          <JsonLd cfg={cfg} />

          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">{cfg.h1}</h1>
              <p className="text-sm text-slate-500">{cfg.lead}</p>
              {cfg.subLead ? (
                <p className="text-xs text-slate-500 max-w-3xl">{cfg.subLead}</p>
              ) : null}
            </div>
            <div className="pt-0.5">{uiConfig.enableToolMenu ? <ToolMenu /> : null}</div>
          </header>

          {Content}
        </div>
      </div>
    );
  };
}

