"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import CodeMirror from "@uiw/react-codemirror";
import { csharp } from "@replit/codemirror-lang-csharp";
import { EditorView } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet } from "@codemirror/view";
import { useIsDark } from "@/atoms/theme";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  highlightLine?: number | null;
  showFullscreenToggle?: boolean;
}

// 创建高亮效果
const highlightEffect = StateEffect.define<number | null>();

// 高亮字段
const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(highlightEffect)) {
        if (effect.value !== null && effect.value !== undefined) {
          const line = tr.state.doc.line(effect.value);
          const highlightMark = Decoration.line({
            class: "cm-highlight-line",
          });
          value = Decoration.set([highlightMark.range(line.from)]);
        } else {
          value = Decoration.none;
        }
      }
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const editorDarkTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#141414", color: "#d4d4d4" },
    ".cm-content": { caretColor: "#d4d4d4" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#d4d4d4" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "#264f78" },
    ".cm-panels": { backgroundColor: "#141414", color: "#d4d4d4" },
    ".cm-panels.cm-panels-top": { borderBottom: "1px solid #2a2a2a" },
    ".cm-panels.cm-panels-bottom": { borderTop: "1px solid #2a2a2a" },
    ".cm-activeLine": { backgroundColor: "#1a1a1a" },
    ".cm-gutters": {
      backgroundColor: "#141414",
      color: "#858585",
      borderRight: "1px solid #2a2a2a",
    },
    ".cm-activeLineGutter": { backgroundColor: "#1a1a1a" },
    ".cm-foldPlaceholder": { backgroundColor: "#2a2a2a", color: "#ccc" },
    ".cm-matchingBracket": {
      backgroundColor: "#2a2a2a",
      outline: "1px solid #888",
    },
    ".cm-tooltip": {
      backgroundColor: "#1a1a1a",
      color: "#d4d4d4",
      border: "1px solid #2a2a2a",
    },
  },
  { dark: true },
);

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  height = "600px",
  highlightLine,
}) => {
  const editorRef = useRef<{ view?: EditorView } | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = useIsDark();

  const themeExtension = useMemo(() => (isDark ? editorDarkTheme : []), [isDark]);

  useEffect(() => {
    if (highlightLine === null || highlightLine === undefined) {
      return;
    }

    // 延迟执行，确保编辑器已渲染
    const timeout = setTimeout(() => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      const view = editor.view;
      if (!view) return;

      try {
        const line = view.state.doc.line(highlightLine);

        // 滚动到该行
        view.dispatch({
          effects: EditorView.scrollIntoView(line.from, { y: "center" }),
        });

        // 添加高亮
        view.dispatch({
          effects: highlightEffect.of(highlightLine),
        });

        // 3 秒后移除高亮，防止以后滚动再次触发闪烁
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        clearTimeoutRef.current = setTimeout(() => {
          try {
            view.dispatch({
              effects: highlightEffect.of(null),
            });
          } catch {
            // 视图可能已经被销毁，忽略
          }
        }, 3000);
      } catch (error) {
        console.warn("Failed to highlight line:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, [highlightLine]);

  // 全屏时禁止 body 滚动
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  const normalEditorHeight = height;
  const fullscreenEditorHeight = "calc(100vh - 48px)"; // 48px 预留顶部工具栏高度

  // 全屏渲染：通过 Portal 直接挂到 body，完全占据浏览器窗口
  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[1200] flex flex-col bg-white dark:bg-dark-base">
        <div className="flex items-center justify-end px-3 py-2 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base shadow-sm">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-500 dark:text-slate-400 shadow-sm hover:border-blue-500 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => setIsFullscreen(false)}
          >
            <Icon icon="mdi:fullscreen-exit" width={18} height={18} />
          </button>
        </div>
        <div
          className="flex-1 w-full min-w-0"
          style={{ height: fullscreenEditorHeight }}
        >
          <CodeMirror
            value={value}
            height={fullscreenEditorHeight}
            width="100%"
            theme={isDark ? "dark" : "light"}
            extensions={[csharp(), highlightField, themeExtension]}
            onChange={(val) => {
              if (!readOnly && onChange) {
                onChange(val);
              }
            }}
            ref={editorRef}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
            }}
            editable={!readOnly}
          />
        </div>
      </div>,
      document.body,
    );
  }

  // 普通非全屏模式
  return (
    <div className="relative w-full">
      <div className="flex items-center justify-end mb-1">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-500 dark:text-slate-400 shadow-sm hover:border-blue-500 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          onClick={() => setIsFullscreen(true)}
        >
          <Icon icon="mdi:fullscreen" width={18} height={18} />
        </button>
      </div>
      <div
        className="w-full min-w-0 flex-1"
        style={{ height: normalEditorHeight }}
      >
        <CodeMirror
          value={value}
          height={normalEditorHeight}
          width="100%"
          theme={isDark ? "dark" : "light"}
          extensions={[csharp(), highlightField, themeExtension]}
          onChange={(val) => {
            if (!readOnly && onChange) {
              onChange(val);
            }
          }}
          ref={editorRef}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
          }}
          editable={!readOnly}
        />
      </div>
    </div>
  );
};
