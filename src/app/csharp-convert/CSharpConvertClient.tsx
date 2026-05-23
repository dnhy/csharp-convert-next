"use client";

import React, { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import { CodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertCSharpScript, reverseConvertCSharpFile } from "@/utils/csharpConverter";
import { AiLoadingOverlay } from "@/components/AiLoadingOverlay";

type MessageType = "success" | "error" | "warning";

interface MessageState {
  type: MessageType;
  text: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export function CSharpConvertClient() {
  const [sourceCode, setSourceCode] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [converting, setConverting] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [isAIMode, setIsAIMode] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // 数据源配置
  const [connectionString, setConnectionString] = useState<string>(
    "User ID=postgres;Password=yOW#tq0Hfm;Host=172.16.26.88;Port=5432;Database=V5MESPro;Pooling=true;Connection Lifetime=0;",
  );
  const [dbType, setDbType] = useState<string>("PostgreSQL");

  const showMessage = useCallback((type: MessageType, text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  }, []);

  const handleConvert = useCallback(async () => {
    const trimmed = sourceCode.trim();
    if (!trimmed) {
      showMessage("warning", "请输入源文件内容");
      return;
    }

    if (isAIMode) {
      setAiLoading(true);
      try {
        const prompt = `你是一个 C# 代码转换专家。请将以下 C# 脚本代码转换为一个完整的、可编译运行的 .cs 文件。严格遵循以下规则：

## 结构要求
- 生成 namespace BIScriptTest，所有代码放在其中
- 在 namespace 内部生成 internal class Program，包含 static async Task Main(string[] args) 方法

## using 声明
必须包含以下 using：
using Azure;
using Dm;
using FreeRedis;
using MiniExcelLibs;
using Newtonsoft.Json;
using OfficeOpenXml;
using OfficeOpenXml.Drawing;
using SqlSugar;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using static System.Runtime.InteropServices.JavaScript.JSType;

## Main 方法内容
- 初始化 SqlSugarManager：Global.SqlManager = new SqlSugarManager("连接字符串", SqlSugar.DbType.PostgreSQL);
- 初始化参数列表：Global.Parameters = new List<SugarParameter>();
- 使用 #region script code remove res 和 #endregion 包裹脚本代码
- 提取代码中所有 Global.Parameters.FirstOrDefault(x => x.ParameterName == "参数名") 的参数，在 #region 之前生成为 Global.Parameters.Add(new SugarParameter("参数名", ""));
- 注释掉脚本代码中最后一行 return 语句（改为 // return ...）

## 类和函数处理
- 将源代码中的 public class 类定义（包括类前面的 [Attribute] 特性）提取出来，放在 namespace 下、Program 类之前
- 类的访问修饰符保持 public，类内部的方法统一加上 static 关键字
- 将源代码中的函数（public/private/protected/internal 方法），统一转换为 public static，放在 Program 类内部、Main 方法之后
- 排除属性（只有 {{ get; set; }} 没有参数列表的）和字段，只转换有 () 参数列表的方法
- 支持泛型方法，如 GetParamValue<T>(string paramName)

## Program 类结构
- 添加 public static Global Global = new Global(); 供静态方法共享全局上下文
- Main 方法为 static async Task

## 输出要求
- 严格只输出代码，不要任何解释、注释说明或 markdown 标记
- 保持正确的缩进层级：namespace 不缩进，类缩进 4 空格，类成员缩进 8 空格，Main 方法内代码缩进 12 空格

## 脚本代码
${sourceCode}`;
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const raw = (data?.content ?? data?.response ?? data?.message ?? JSON.stringify(data)).trim();
        const code = raw
          .replace(/^```[\w]*\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
        setConvertedCode(code);
        showMessage("success", "AI 转换成功");
      } catch (error) {
        console.error(error);
        showMessage("error", "AI 转换失败");
      } finally {
        setAiLoading(false);
      }
      return;
    }

    setConverting(true);
    try {
      // 转换时不应用数据源配置，使用默认值
      const result = convertCSharpScript(sourceCode);
      setConvertedCode(result);
      showMessage("success", "转换成功");
    } catch (error) {
      console.error(error);
      showMessage("error", "转换失败");
    } finally {
      setConverting(false);
    }
  }, [sourceCode, showMessage, isAIMode]);

  const handleReverseConvert = useCallback(async () => {
    if (isAIMode) {
      setAiLoading(true);
      try {
        const prompt = `你是一个 C# 代码还原专家。请将以下完整的 .cs 文件反向还原为原始的 C# 脚本代码。严格遵循以下规则：

## 提取内容
- 从 namespace 中提取非 Program 的 public class 类定义，去除类内部方法上的 static 关键字，保持原访问修饰符
- 从 Program 类中提取所有 public static 方法（排除 Main 方法），去除 static 关键字还原为普通方法
- 提取 #region script code remove res 和 #endregion 之间的脚本代码，去除 Main 方法级别的缩进（12 空格），还原为顶级代码
- 将脚本代码中被注释的 // return 语句还原为正常 return 语句

## 输出顺序
按照以下顺序拼接输出，各部分之间用空行分隔：
1. 独立类定义（public class，不使用 static）
2. 独立函数（去除 static 修饰，缩减缩进到顶级）
3. 脚本代码（从 #region script code remove res 中提取并去除缩进）

## 输出要求
- 严格只输出代码，不要任何解释、注释说明或 markdown 标记
- 保持顶级缩进为 0（无缩进），块内部使用 4 空格缩进

## 待还原代码
${convertedCode}`;
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const raw = (data?.content ?? data?.response ?? data?.message ?? JSON.stringify(data)).trim();
        const code = raw
          .replace(/^```[\w]*\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
        setSourceCode(code);
        showMessage("success", "AI 反向转换成功");
      } catch (error) {
        console.error(error);
        showMessage("error", "AI 反向转换失败");
      } finally {
        setAiLoading(false);
      }
      return;
    }

    setConverting(true);
    try {
      const result = reverseConvertCSharpFile(convertedCode);
      setSourceCode(result);
      showMessage("success", "反向转换成功");
    } catch (error) {
      console.error(error);
      showMessage("error", "反向转换失败");
    } finally {
      setConverting(false);
    }
  }, [convertedCode, showMessage, isAIMode]);

  const handleClear = useCallback(() => {
    setSourceCode("");
    setConvertedCode("");
  }, []);

  const handleCopy = useCallback(async () => {
    if (!convertedCode) {
      showMessage("warning", "没有可复制的代码");
      return;
    }

    try {
      await navigator.clipboard.writeText(convertedCode);
      showMessage("success", "复制到剪贴板成功");
    } catch (error) {
      console.error(error);
      showMessage("error", "复制到剪贴板失败");
    }
  }, [convertedCode, showMessage]);

  const handleToggleAIMode = useCallback(() => {
    setIsAIMode((prev) => !prev);
  }, []);

  const handleApplyDataSource = useCallback(() => {
    if (!convertedCode.trim()) {
      showMessage("warning", "请先进行转换");
      return;
    }

    try {
      const sqlSugarManagerRegex =
        /Global\.SqlManager\s*=\s*new\s+SqlSugarManager\s*\([^)]+\)\s*;/;

      const lines = convertedCode.split("\n");
      let targetLineNumber: number | null = null;
      for (let i = 0; i < lines.length; i++) {
        if (sqlSugarManagerRegex.test(lines[i])) {
          targetLineNumber = i + 1;
          break;
        }
      }

      const newDataSourceLine = `Global.SqlManager = new SqlSugarManager("${connectionString.replace(
        /"/g,
        '\\"',
      )}", SqlSugar.DbType.${dbType});`;

      const updatedCode = convertedCode.replace(sqlSugarManagerRegex, newDataSourceLine);
      setConvertedCode(updatedCode);

      if (targetLineNumber !== null) {
        setHighlightLine(null);
        setTimeout(() => {
          setHighlightLine(targetLineNumber);
        }, 150);
      }

      showMessage("success", "数据源配置已应用");
    } catch (error) {
      console.error(error);
      showMessage("error", "应用数据源配置失败");
    }
  }, [connectionString, dbType, convertedCode, showMessage]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Script Code</span>
          </div>
          <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
            <CodeEditor value={sourceCode} onChange={setSourceCode} />
          </div>
        </div>

        <div className="flex flex-col min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Debug Code</span>
          </div>
          <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
            <CodeEditor
              value={convertedCode}
              onChange={setConvertedCode}
              highlightLine={highlightLine}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={handleConvert}
          disabled={converting}
          className={isAIMode ? "ai-mode-btn" : ""}
        >
          {isAIMode && <Icon icon="mdi:star-four-points" width={16} height={16} className="mr-1 rainbow-icon" />}
          {converting ? "转换中..." : "转换"}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          清空
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReverseConvert}
          className={isAIMode ? "ai-mode-btn" : ""}
        >
          {isAIMode && <Icon icon="mdi:star-four-points" width={16} height={16} className="mr-1 rainbow-icon" />}
          反向转换
        </Button>
        <Button type="button" variant="outline" onClick={handleCopy}>
          复制 Debug 代码到剪贴板
        </Button>
        <Button
          type="button"
          variant={isAIMode ? "outline" : "default"}
          onClick={handleToggleAIMode}
          className={isAIMode ? "" : "rainbow-btn-bg"}
        >
          {isAIMode ? (
            <>
              <Icon icon="mdi:arrow-left-bold" width={18} height={18} className="mr-1" />
              返回普通模式
            </>
          ) : (
            <>
              <Icon icon="mdi:star-four-points" width={18} height={18} className="mr-1 rainbow-icon" />
              AI 转换
            </>
          )}
        </Button>
      </div>

      {message && <div className={`message message-${message.type}`}>{message.text}</div>}
      {aiLoading && <AiLoadingOverlay />}

      <section className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">配置数据源</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-slate-600">连接字符串</Label>
            <Input
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="请输入连接字符串"
            />
          </div>
          <div className="w-full md:w-52 space-y-1">
            <Label className="text-xs text-slate-600">数据库类型</Label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              value={dbType}
              onChange={(e) => setDbType(e.target.value)}
            >
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="SqlServer">SqlServer</option>
              <option value="MySql">MySql</option>
              <option value="Oracle">Oracle</option>
              <option value="Sqlite">Sqlite</option>
            </select>
          </div>
          <div className="flex-shrink-0">
            <Button type="button" onClick={handleApplyDataSource}>
              应用
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

