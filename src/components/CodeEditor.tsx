"use client";

import React, { useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { csharp } from "@replit/codemirror-lang-csharp";
import { EditorView } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet } from "@codemirror/view";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  highlightLine?: number | null;
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

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  height = "600px",
  highlightLine,
}) => {
  const editorRef = useRef<{ view?: EditorView } | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div style={{ width: "100%", height, minWidth: 0 }}>
      <CodeMirror
        value={value}
        height={height}
        width="100%"
        extensions={[csharp(), highlightField]}
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
  );
};

