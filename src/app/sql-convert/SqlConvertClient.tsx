"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applySqlVariables, extractSqlFromCSharp, reverseSqlToCSharpVar } from "@/utils/sqlConverter";

type MessageType = "success" | "error" | "warning";

interface MessageState {
  type: MessageType;
  text: string;
}

export function SqlConvertClient() {
  const [csharpCode, setCsharpCode] = useState<string>("");
  const [sqlOutput, setSqlOutput] = useState<string>("");
  const [converting, setConverting] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);

  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  const showMessage = useCallback((type: MessageType, text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  }, []);

  const syncValuesWithVars = useCallback((vars: string[]) => {
    setValues((prev) => {
      const next: Record<string, string> = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!vars.includes(k)) delete next[k];
      });
      vars.forEach((k) => {
        if (next[k] === undefined) next[k] = "";
      });
      return next;
    });
  }, []);

  const handleConvert = useCallback(() => {
    const trimmed = csharpCode.trim();
    if (!trimmed) {
      showMessage("warning", "请输入包含 SQL 字符串的 C# 代码");
      return;
    }

    setConverting(true);
    try {
      const extracted = extractSqlFromCSharp(csharpCode);
      if (!extracted.sql.trim()) {
        setSqlOutput("");
        setVariables([]);
        syncValuesWithVars([]);
        showMessage("warning", "未识别到 SQL 字符串，请确认包含 var sql = $@\"...\" 或类似写法");
        return;
      }

      setVariables(extracted.variables);
      syncValuesWithVars(extracted.variables);
      const finalSql = applySqlVariables(extracted.sql, values, { quoteAtParams: true });
      setSqlOutput(finalSql);
      showMessage("success", "转换成功");
    } catch (error) {
      console.error(error);
      showMessage("error", "转换失败");
    } finally {
      setConverting(false);
    }
  }, [csharpCode, showMessage, syncValuesWithVars, values]);

  useEffect(() => {
    syncValuesWithVars(variables);
  }, [variables, syncValuesWithVars]);

  const handleClear = useCallback(() => {
    setCsharpCode("");
    setSqlOutput("");
    setVariables([]);
    setValues({});
  }, []);

  const handleCopy = useCallback(async () => {
    if (!sqlOutput) {
      showMessage("warning", "没有可复制的 SQL");
      return;
    }
    try {
      await navigator.clipboard.writeText(sqlOutput);
      showMessage("success", "复制到剪贴板成功");
    } catch (error) {
      console.error(error);
      showMessage("error", "复制到剪贴板失败");
    }
  }, [sqlOutput, showMessage]);

  const handleReverseConvert = useCallback(() => {
    const trimmed = sqlOutput.trim();
    if (!trimmed) {
      showMessage("warning", "请输入右侧 SQL Output 内容");
      return;
    }
    try {
      const csharp = reverseSqlToCSharpVar(sqlOutput, { variableName: "sql", interpolated: true });
      setCsharpCode(csharp);
      setVariables([]);
      setValues({});
      showMessage("success", "反向转换成功");
    } catch (e) {
      console.error(e);
      showMessage("error", "反向转换失败");
    }
  }, [sqlOutput, showMessage]);

  const variableRows = useMemo(() => {
    return variables.map((name) => ({
      name,
      value: values[name] ?? "",
    }));
  }, [variables, values]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">C# Code</span>
          </div>
          <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
            <CodeEditor value={csharpCode} onChange={setCsharpCode} />
          </div>
        </div>

        <div className="flex flex-col min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">SQL Output</span>
          </div>
          <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
            <CodeEditor value={sqlOutput} onChange={setSqlOutput} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={handleConvert} disabled={converting}>
          {converting ? "转换中..." : "转换"}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          清空
        </Button>
        <Button type="button" variant="outline" onClick={handleReverseConvert}>
          反向转换
        </Button>
        <Button type="button" variant="outline" onClick={handleCopy}>
          复制 SQL 到剪贴板
        </Button>
      </div>

      {message && <div className={`message message-${message.type}`}>{message.text}</div>}

      <section className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">外部变量</h2>
        <p className="text-xs text-slate-600">
          识别规则：<code>@linename</code> 会替换为 <code>{`'实际值'`}</code>（自动加单引号并转义），
          <code>{"{queryStartTime}"}</code> 直接替换为输入内容（不自动加引号）。
        </p>

        {variableRows.length === 0 ? (
          <div className="text-sm text-slate-500">暂无变量。点击“转换”后会自动识别并显示。</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {variableRows.map((row) => (
              <div key={row.name} className="space-y-1">
                <Label className="text-xs text-slate-600">{row.name}</Label>
                <Input
                  type="text"
                  value={row.value}
                  onChange={(e) => setValues((prev) => ({ ...prev, [row.name]: e.target.value }))}
                  placeholder={`请输入 ${row.name} 的实际值`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              try {
                const extracted = extractSqlFromCSharp(csharpCode);
                if (!extracted.sql.trim()) {
                  showMessage("warning", "请先粘贴包含 SQL 的 C# 代码并转换");
                  return;
                }
                const finalSql = applySqlVariables(extracted.sql, values, { quoteAtParams: true });
                setSqlOutput(finalSql);
                showMessage("success", "已应用变量");
              } catch (e) {
                console.error(e);
                showMessage("error", "应用变量失败");
              }
            }}
          >
            应用变量到输出
          </Button>
        </div>
      </section>
    </>
  );
}

