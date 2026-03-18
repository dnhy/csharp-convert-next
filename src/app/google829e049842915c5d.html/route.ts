import { seoConfig } from "@/config/seoConfig";

export async function GET() {
  // Google Search Console HTML 文件验证要求：返回纯文本
  // 内容必须为：google-site-verification: <filename>
  return new Response(`google-site-verification: ${seoConfig.googleHtmlVerificationFile}`, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

