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

  useEffect(() => {
    if (highlightLine !== null && highlightLine !== undefined) {
      // 延迟执行，确保编辑器已渲染
      const timeout = setTimeout(() => {
        if (editorRef.current) {
          const editor = editorRef.current;
          const view = editor.view;

          if (view) {
            try {
              const line = view.state.doc.line(highlightLine);

              // 滚动到该行
              view.dispatch({
                effects: EditorView.scrollIntoView(line.from, { y: "center" }),
              });

              // 添加高亮（不在这里移除，由 CSS 动画负责淡出）
              view.dispatch({
                effects: highlightEffect.of(highlightLine),
              });
            } catch (error) {
              // 行号可能超出范围，忽略错误
              console.warn("Failed to highlight line:", error);
            }
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }
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

