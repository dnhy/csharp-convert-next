"use client";

import React, { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import { CodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  convertCSharpScript,
  reverseConvertCSharpFile,
} from "@/utils/csharpConverter";
import { AiLoadingOverlay } from "@/components/AiLoadingOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";

type MessageType = "success" | "error" | "warning";

interface MessageState {
  type: MessageType;
  text: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const xAuthToken =
  "6440ce74bf0a6e0e9ff12ab4b7b4d0e4f9f4478247fa7ee264c4efa43e9adb1e";

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
    "User ID=postgres;Password=yOW#tq0Hfm;Host=172.16.26.88;Port=5432;Database=V5MESPro;Pooling=true;Connection Lifetime=0;"
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
        const prompt = {
          script: sourceCode,
          type: 1,
        };

        const signature = await calcSignature();

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": xAuthToken,
            "X-Signature": signature,
          },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const raw = (
          data?.content ??
          data?.response ??
          data?.message ??
          JSON.stringify(data)
        ).trim();
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

  const calcSignature = async () => {
    const timestamp = Date.now().toString();
    const payload = `${timestamp}:${JSON.stringify(prompt)}`;

    // 浏览器环境使用 Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode("your-sign-secret-key"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const signature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return signature;
  };

  const handleReverseConvert = useCallback(async () => {
    if (isAIMode) {
      setAiLoading(true);
      try {
        const prompt = {
          script: convertedCode,
          type: -1,
        };

        const signature = await calcSignature();

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": xAuthToken,
            "X-Signature": signature,
          },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const raw = (
          data?.content ??
          data?.response ??
          data?.message ??
          JSON.stringify(data)
        ).trim();
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
        '\\"'
      )}", SqlSugar.DbType.${dbType});`;

      const updatedCode = convertedCode.replace(
        sqlSugarManagerRegex,
        newDataSourceLine
      );
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
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Script Code
            </span>
          </div>
          <div className="border border-slate-200 dark:border-dark-border rounded-md overflow-hidden bg-slate-50 dark:bg-dark-surface">
            <CodeEditor value={sourceCode} onChange={setSourceCode} />
          </div>
        </div>

        <div className="flex flex-col min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Debug Code
            </span>
          </div>
          <div className="border border-slate-200 dark:border-dark-border rounded-md overflow-hidden bg-slate-50 dark:bg-dark-surface">
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
          {isAIMode && (
            <Icon
              icon="mdi:star-four-points"
              width={16}
              height={16}
              className="mr-1 rainbow-icon"
            />
          )}
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
          {isAIMode && (
            <Icon
              icon="mdi:star-four-points"
              width={16}
              height={16}
              className="mr-1 rainbow-icon"
            />
          )}
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
              <Icon
                icon="mdi:arrow-left-bold"
                width={18}
                height={18}
                className="mr-1"
              />
              返回普通模式
            </>
          ) : (
            <>
              <Icon
                icon="mdi:star-four-points"
                width={18}
                height={18}
                className="mr-1 rainbow-icon"
              />
              AI 转换
            </>
          )}
        </Button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}
      {aiLoading && <AiLoadingOverlay />}
      <ThemeToggle />

      <section className="mt-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">配置数据源</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400">连接字符串</Label>
            <Input
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="请输入连接字符串"
            />
          </div>
          <div className="w-full md:w-52 space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400">数据库类型</Label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-1 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
