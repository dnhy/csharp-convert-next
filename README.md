# C# Script Converter (Next.js)

一个基于 Next.js 的 C# 脚本转换小工具，用于在「脚本代码」与「可调试 C# 文件」之间来回转换，并支持配置数据源、代码高亮和全屏编辑。

## 功能特性

- **正向转换**：
  - 将脚本形式的 C# 代码转换为可编译运行的 `.cs` 文件。
  - 自动生成 `using`、`namespace`、`Program.Main` 等结构。
  - 在 `#region script code remove res` 下方自动插入：
    `//var id = Global.Parameters.FirstOrDefault(x => x.ParameterName == "Id")?.Value?.ToString();`
- **反向转换**：
  - 从生成后的 C# 文件中还原出原始脚本逻辑。
  - 支持提取实体类、脚本代码区域以及 `Program` 中的 `public static` 方法（如 `GetParamValue<T>`）。
- **数据源配置**：
  - 在页面底部配置连接字符串与 `SqlSugar.DbType`。
  - 点击「应用」按钮时，仅修改已转换代码中的 `Global.SqlManager` 配置行，并高亮该行位置。
- **代码编辑体验**：
  - 使用 `@uiw/react-codemirror` + C# 语法高亮。
  - 编辑器支持**全屏模式**（右上角 Iconify 图标切换）。
  - 应用数据源时自动滚动到修改行，并提供 3 秒高亮淡出效果。
- **UI 技术栈**：
  - 集成 **Tailwind CSS** 作为样式基础。
  - 参考 **shadcn/ui** 设计了一套 `Button`、`Input`、`Label` 基础组件，用于构建操作区和数据源配置区域。

## 技术栈

- **框架**：Next.js 16（App Router）
- **语言**：TypeScript + React 19
- **编辑器**：`@uiw/react-codemirror` + `@replit/codemirror-lang-csharp`
- **样式**：Tailwind CSS + 自定义全局样式
- **UI 组件**：
  - 自实现的 `Button` / `Input` / `Label`（位于 `src/components/ui`）
  - CodeMirror 编辑器封装组件 `CodeEditor`，集成全屏和行高亮

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

开发环境默认运行在 `http://localhost:3000`，核心页面路径为：`/csharp-convert`。

## 主要目录结构

- `src/app/csharp-convert/page.tsx`  
  页面入口，包含脚本编辑器、转换后代码编辑器、操作按钮以及数据源配置区。

- `src/components/CodeEditor.tsx`  
  封装的 CodeMirror 编辑器：
  - 支持 C# 语法高亮；
  - 支持全屏（Iconify 图标）；
  - 支持指定行高亮并滚动居中。

- `src/utils/csharpConverter.ts`  
  核心转换逻辑：
  - `convertCSharpScript`：正向转换；
  - `reverseConvertCSharpFile`：反向转换；
  - 内部包含解析类、方法、脚本区域的诸多工具函数。

- `src/components/ui/button.tsx` / `input.tsx` / `label.tsx`  
  参考 shadcn/ui 风格的基础 UI 组件，使用 Tailwind CSS 实现。

- `src/app/globals.css`  
  Tailwind 引导文件（`@tailwind base/components/utilities`）+ 页面布局、自定义样式、CodeMirror 高亮动画等。

## Tailwind CSS 集成说明

项目已完成 Tailwind CSS 集成：

- `tailwind.config.js` 配置了 `src/app` 和 `src/components` 目录的扫描路径。
- `postcss.config.js` 中启用了 `tailwindcss` 与 `autoprefixer`。
- `src/app/globals.css` 顶部引入：
  - `@tailwind base;`
  - `@tailwind components;`
  - `@tailwind utilities;`

你可以直接在 JSX 中使用 Tailwind 工具类（例如 `flex`, `gap-4`, `mt-4` 等）来快速迭代样式。

## UI 重构说明（shadcn 风格）

虽然没有直接通过 CLI 全量拉取 shadcn/ui 组件库，但本项目：

- 参考 shadcn/ui 的 API 与样式理念，封装了：
  - `Button`：支持 `default` / `outline` 两种变体；
  - `Input`：统一的输入框样式；
  - `Label`：表单标签组件。
- 在 `csharp-convert` 页面中，所有原生 `button` / `input` 都已替换为上述组件，并辅以 Tailwind 布局类。

后续如果需要，可以进一步：

- 引入更多组件（如 `Select`、`Card` 等）；
- 或接入官方 shadcn CLI 完整生成组件目录，然后逐步替换自定义实现。

## 使用指南（功能流程）

1. 在左侧编辑器中粘贴或编写 **脚本代码**。
2. 点击「**转换**」按钮：
   - 右侧会生成完整的 C# 程序文件；
   - 包含实体类、`Program`、`Main` 方法以及 `#region script code remove res` 代码块。
3. 如需根据不同环境调整数据源：
   - 在底部「配置数据源」中填写连接字符串与数据库类型；
   - 点击「**应用**」按钮：
     - 程序会仅替换 `Global.SqlManager = new SqlSugarManager(...);` 这一行；
     - 右侧代码自动滚动到该行，并高亮 3 秒后淡出。
4. 点击「**反向转换**」按钮：
   - 会从右侧完整 C# 文件中提取出脚本代码与工具方法（如 `GetParamValue<T>`），回写到左侧编辑器。
5. 点击编辑器右上角的全屏图标，可进入 / 退出全屏模式，便于查看长脚本。

## 备注

- 如果在转换或反向转换过程中遇到异常，请查看浏览器控制台或终端日志中的错误信息，通常与脚本结构（括号、`namespace`、`class` 等）有关。
- 所有 UI 组件与样式均在本仓库中可见，便于后续二次开发和自定义。

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
