"use client";

import React, { useCallback, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ToolMenu } from "@/components/ToolMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uiConfig } from "@/config/uiConfig";
import {
  convertCSharpScript,
  reverseConvertCSharpFile,
} from "@/utils/csharpConverter";

type MessageType = "success" | "error" | "warning";

interface MessageState {
  type: MessageType;
  text: string;
}

export default function CSharpConvertPage() {
  const [sourceCode, setSourceCode] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [converting, setConverting] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  
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

  const handleConvert = useCallback(() => {
    const trimmed = sourceCode.trim();
    if (!trimmed) {
      showMessage("warning", "请输入源文件内容");
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
  }, [sourceCode, showMessage]);

  const handleReverseConvert = useCallback(() => {
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
  }, [convertedCode, showMessage]);

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

  const handleApplyDataSource = useCallback(() => {
    if (!convertedCode.trim()) {
      showMessage("warning", "请先进行转换");
      return;
    }

    // 替换转换后代码中的数据源配置
    try {
      // 匹配 SqlSugarManager 的配置行
      const sqlSugarManagerRegex = /Global\.SqlManager\s*=\s*new\s+SqlSugarManager\s*\([^)]+\)\s*;/;
      
      // 找到匹配行的行号
      const lines = convertedCode.split('\n');
      let targetLineNumber: number | null = null;
      
      for (let i = 0; i < lines.length; i++) {
        if (sqlSugarManagerRegex.test(lines[i])) {
          targetLineNumber = i + 1; // 行号从1开始
          break;
        }
      }
      
      // 构建新的数据源配置行
      const newDataSourceLine = `Global.SqlManager = new SqlSugarManager("${connectionString.replace(/"/g, '\\"')}", SqlSugar.DbType.${dbType});`;
      
      // 替换数据源配置
      const updatedCode = convertedCode.replace(sqlSugarManagerRegex, newDataSourceLine);
      setConvertedCode(updatedCode);
      
      // 设置高亮行号并滚动
      if (targetLineNumber !== null) {
        // 先重置为 null，确保每次都能触发高亮
        setHighlightLine(null);
        // 延迟一下，确保代码已更新，然后再设置高亮行号
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
    <div className="min-h-screen bg-slate-100 py-4 px-2">
      <div className="w-full rounded-none border-b border-slate-200 bg-white shadow-sm p-4 md:p-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">C# 脚本转换器</h1>
            <p className="text-sm text-slate-500">
              在左侧编辑脚本代码，右侧查看生成的可调试 C# 文件，可在底部配置数据源。
            </p>
          </div>
          <div className="pt-0.5">
            {uiConfig.enableToolMenu ? <ToolMenu /> : null}
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Script Code
              </span>
            </div>
            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
              <CodeEditor value={sourceCode} onChange={setSourceCode} />
            </div>
          </div>

          <div className="flex flex-col min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Debug Code
              </span>
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
          >
            {converting ? "转换中..." : "转换"}
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            清空
          </Button>
          <Button type="button" variant="outline" onClick={handleReverseConvert}>
            反向转换
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy}>
            复制 Debug 代码到剪贴板
          </Button>
        </div>

        {message && (
          <div className={`message message-${message.type}`}>{message.text}</div>
        )}

        <section className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">
            配置数据源
          </h2>
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
      </div>
    </div>
  );
}
