import type { Metadata } from "next";
import { CSharpConvertClient } from "./CSharpConvertClient";
import {
  createToolMetadata,
  createToolPage,
  type ToolPageConfig,
} from "../_shared/toolPageFactory";

const cfg: ToolPageConfig = {
  h1: "C# 脚本转换器",
  lead: <>在左侧编辑脚本代码，右侧查看生成的可调试 C# 文件，可在底部配置数据源。</>,
  subLead: (
    <>
      功能：脚本与调试文件双向转换；支持一键替换 SqlSugar 数据源配置；代码仅在本地浏览器处理，不上传服务器。
    </>
  ),
  path: "/csharp-convert",
  metaTitle: "C# 脚本转换器 | 在线 C# Script 转 Debug 文件",
  metaDescription:
    "把 C# 脚本快速转换成可调试的 C# 文件，并支持反向转换与数据源配置替换。适用于快速定位问题与调试。",
  shareTitle: "C# 脚本转换器",
  shareDescription: "脚本 ⇄ 可调试 C# 文件，支持一键替换数据源配置。",
  jsonLd: {
    name: "C# 脚本转换器",
    description:
      "把 C# 脚本快速转换成可调试的 C# 文件，并支持反向转换与数据源配置替换。",
  },
};

export const metadata: Metadata = createToolMetadata(cfg);

const Page = createToolPage(cfg, <CSharpConvertClient />);
export default Page;

