function normalize(url: string) {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromPublic) return normalize(fromPublic);

  const fromVercel = process.env.VERCEL_URL;
  if (fromVercel) return `https://${normalize(fromVercel)}`;

  return "http://localhost:3000";
}

