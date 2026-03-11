"use client";

import React, { useCallback, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
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
    <div className="page-container">
      <h1 className="page-title">C# 脚本转换器</h1>
      <div className="editor-row">
        <div className="editor-col">
          <div className="editor-label">script内容</div>
          <CodeEditor value={sourceCode} onChange={setSourceCode} />
        </div>
        <div className="editor-col">
          <div className="editor-label">debug代码</div>
          <CodeEditor
            value={convertedCode}
            onChange={setConvertedCode}
            highlightLine={highlightLine}
          />
        </div>
      </div>
      <div className="action-row">
        <button
          type="button"
          className="primary-button"
          onClick={handleConvert}
          disabled={converting}
        >
          {converting ? "转换中..." : "转换"}
        </button>
        <button type="button" className="outline-button" onClick={handleClear}>
          清空
        </button>
        <button
          type="button"
          className="outline-button"
          onClick={handleReverseConvert}
        >
          反向转换
        </button>
        <button
          type="button"
          className="outline-button"
          onClick={handleCopy}
        >
          复制到剪贴板
        </button>
      </div>
      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}
      <div className="data-source-config">
        <div className="data-source-title">配置数据源</div>
        <div className="data-source-row">
          <div className="data-source-field">
            <label className="data-source-label">连接字符串：</label>
            <input
              type="text"
              className="data-source-input"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="请输入连接字符串"
            />
          </div>
          <div className="data-source-field">
            <label className="data-source-label">数据库类型：</label>
            <select
              className="data-source-select"
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
          <button
            type="button"
            className="primary-button"
            onClick={handleApplyDataSource}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
