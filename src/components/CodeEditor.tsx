"use client";

import React from "react";
import { Controlled as ControlledCodeMirror } from "@uiw/react-codemirror";
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
    <div style={{ width: "100%", height }}>
      <ControlledCodeMirror
        value={value}
        height={height}
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

