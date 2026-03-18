import { SqlConvertClient } from "./SqlConvertClient";
import {
  createToolMetadata,
  createToolPage,
  type ToolPageConfig,
} from "../_shared/toolPageFactory";

const cfg: ToolPageConfig = {
  h1: "SQL 转换器",
  lead: (
    <>
      粘贴包含 SQL 字符串的 C# 代码（如 <code>{`var sql = $@"..."`}</code> 或{" "}
      <code>{`var totalSql = $"..."`}</code>），自动提取 SQL；可填写外部变量并输出最终 SQL。
    </>
  ),
  subLead: (
    <>
      规则：识别 <code>@linename</code>、<code>{"{queryStartTime}"}</code> 等占位符；转换逻辑在本地浏览器执行，不上传服务器。
    </>
  ),
  path: "/sql-convert",
  metaTitle: "SQL 转换器 | 从 C# 提取 SQL / 反向生成字符串",
  metaDescription:
    "从 C# 代码中提取 SQL（支持 $@\"...\" / $\"...\"），识别 @param 与 {param} 变量并替换为实际值；也支持把 SQL 反向生成 var sql = $@\"...\"。",
  shareTitle: "SQL 转换器",
  shareDescription: "提取 C# 中的 SQL，变量替换，并可反向生成 C# 字符串。",
  jsonLd: {
    name: "SQL 转换器",
    description:
      "从 C# 代码中提取 SQL，识别并替换外部变量；支持将 SQL 反向生成 C# verbatim 字符串。",
  },
};

export const metadata = createToolMetadata(cfg);

const Page = createToolPage(cfg, <SqlConvertClient />);
export default Page;

