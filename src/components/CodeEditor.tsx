"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { csharp } from "@replit/codemirror-lang-csharp";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  height = "600px",
}) => {
  return (
    <div style={{ width: "100%", height, minWidth: 0 }}>
      <CodeMirror
        value={value}
        height={height}
        width="100%"
        extensions={[csharp()]}
        onChange={(val) => {
          if (!readOnly && onChange) {
            onChange(val);
          }
        }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
        }}
        editable={!readOnly}
      />
    </div>
  );
};

