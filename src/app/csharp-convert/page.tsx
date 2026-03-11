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
    const trimmed = convertedCode.trim();
    if (!trimmed) {
      showMessage("warning", "请先进行正向转换");
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

  return (
    <div className="page-container">
      <h1 className="page-title">C# 脚本转换器</h1>
      <div className="editor-row">
        <div className="editor-col">
          <div className="editor-label">源文件内容</div>
          <CodeEditor value={sourceCode} onChange={setSourceCode} />
        </div>
        <div className="editor-col">
          <div className="editor-label">转换后的代码</div>
          <CodeEditor
            value={convertedCode}
            readOnly
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
          disabled={!convertedCode || converting}
        >
          反向转换
        </button>
        <button
          type="button"
          className="outline-button"
          onClick={handleCopy}
          disabled={!convertedCode}
        >
          复制到剪贴板
        </button>
      </div>
      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}

