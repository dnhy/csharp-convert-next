import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/csharp-convert", "/sql-convert"],
      },
    ],
    sitemap: "/sitemap.xml",
  };
}

