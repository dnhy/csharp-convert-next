export interface ExtractedSqlResult {
  /**
   * 从 C# 代码中提取并还原后的 SQL 文本（已做 C# 字符串反转义）
   */
  sql: string;
  /**
   * 在 SQL 中识别到的外部变量名（包含 @param 与 {param} 两类）
   */
  variables: string[];
}

export interface ApplyVariablesOptions {
  /**
   * 对形如 @name 的占位符，是否自动加单引号（并做 SQL 单引号转义）。
   * 例如输入 abc => 'abc'
   */
  quoteAtParams?: boolean;
}

const DEFAULT_OPTIONS: Required<ApplyVariablesOptions> = {
  quoteAtParams: true,
};

function isIdentStart(ch: string) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string) {
  return /[A-Za-z0-9_]/.test(ch);
}

function unescapeCSharpStringLiteral(raw: string, kind: "regular" | "verbatim"): string {
  if (kind === "verbatim") {
    // @"..." 或 $@"..."：只需要把 "" 还原成 "
    return raw.replace(/""/g, '"');
  }

  // "..." 或 $"..."：处理常见转义
  // 注意：这里只做对 SQL 常用的少量转义，不追求完整 C# 字符串语义
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function scanCSharpStringLiteral(
  code: string,
  start: number,
): { end: number; content: string; kind: "regular" | "verbatim"; isInterpolated: boolean } | null {
  // 支持：$@"..." @"..." $"..." "..."
  let i = start;
  let isInterpolated = false;
  let kind: "regular" | "verbatim" = "regular";

  if (code[i] === "$") {
    isInterpolated = true;
    i++;
  }
  if (code[i] === "@") {
    kind = "verbatim";
    i++;
  }
  if (code[i] !== '"') return null;
  i++; // skip opening "

  if (kind === "verbatim") {
    // verbatim: 以 " 结束，但 "" 表示转义引号
    let buf = "";
    while (i < code.length) {
      const ch = code[i];
      if (ch === '"') {
        const next = i + 1 < code.length ? code[i + 1] : "";
        if (next === '"') {
          // escaped quote
          buf += '""';
          i += 2;
          continue;
        }
        // end
        const raw = buf;
        return {
          end: i + 1,
          content: unescapeCSharpStringLiteral(raw, "verbatim"),
          kind: "verbatim",
          isInterpolated,
        };
      }
      buf += ch;
      i++;
    }
    return null;
  }

  // regular string: \" \\ \n ...
  let escaped = false;
  let buf = "";
  while (i < code.length) {
    const ch = code[i];
    if (!escaped) {
      if (ch === "\\") {
        escaped = true;
        buf += ch;
        i++;
        continue;
      }
      if (ch === '"') {
        const raw = buf;
        return {
          end: i + 1,
          content: unescapeCSharpStringLiteral(raw, "regular"),
          kind: "regular",
          isInterpolated,
        };
      }
      buf += ch;
      i++;
      continue;
    }

    // escaped char
    buf += ch;
    escaped = false;
    i++;
  }
  return null;
}

function findBestSqlStringLiteral(code: string): { sql: string; isInterpolated: boolean } | null {
  // 策略：扫描所有字符串字面量，挑选“像 SQL”的且最长的一段
  const candidates: { sql: string; isInterpolated: boolean }[] = [];
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch !== "$" && ch !== "@" && ch !== '"') continue;

    const lit = scanCSharpStringLiteral(code, i);
    if (!lit) continue;

    const sql = lit.content;
    const normalized = sql.trim().toLowerCase();
    const looksLikeSql =
      normalized.startsWith("select") ||
      normalized.startsWith("with") ||
      normalized.startsWith("update") ||
      normalized.startsWith("insert") ||
      normalized.startsWith("delete") ||
      normalized.includes(" from ") ||
      normalized.includes("\nselect") ||
      normalized.includes("\nwith ");

    if (looksLikeSql) {
      candidates.push({ sql, isInterpolated: lit.isInterpolated });
    }

    i = lit.end - 1;
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.sql.length - a.sql.length);
  return candidates[0];
}

function extractVariablesFromSql(sql: string): string[] {
  const vars = new Set<string>();

  // 1) {name}（C# 插值占位符）。注意跳过 {{ 和 }}
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch !== "{") continue;
    const next = i + 1 < sql.length ? sql[i + 1] : "";
    if (next === "{") {
      i++;
      continue;
    }

    let j = i + 1;
    // 忽略前导空白
    while (j < sql.length && /\s/.test(sql[j])) j++;
    if (j >= sql.length || !isIdentStart(sql[j])) continue;
    let name = sql[j];
    j++;
    while (j < sql.length && isIdentPart(sql[j])) {
      name += sql[j];
      j++;
    }
    // 忽略尾部空白
    while (j < sql.length && /\s/.test(sql[j])) j++;
    if (j < sql.length && sql[j] === "}") {
      vars.add(name);
      i = j;
    }
  }

  // 2) @name（SQL 参数占位符）
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch !== "@") continue;
    const next = i + 1 < sql.length ? sql[i + 1] : "";
    if (!isIdentStart(next)) continue;
    let j = i + 1;
    let name = sql[j];
    j++;
    while (j < sql.length && isIdentPart(sql[j])) {
      name += sql[j];
      j++;
    }
    vars.add(name);
    i = j - 1;
  }

  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}

export function extractSqlFromCSharp(code: string): ExtractedSqlResult {
  const best = findBestSqlStringLiteral(code);
  const sql = best?.sql ?? "";
  const variables = sql ? extractVariablesFromSql(sql) : [];
  return { sql, variables };
}

function escapeSqlSingleQuoted(value: string): string {
  return value.replace(/'/g, "''");
}

export function applySqlVariables(
  sql: string,
  values: Record<string, string>,
  options?: ApplyVariablesOptions,
): string {
  const opt = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  let out = sql;

  // 先替换 {name}
  // 规则：直接替换为用户输入（不额外加引号），因为原 SQL 字符串里可能已经有引号/类型转换
  out = out.replace(/\{\{\s*/g, "{{"); // normalize
  out = out.replace(/\s*\}\}/g, "}}");
  out = out.replace(/\{(\s*[A-Za-z_][A-Za-z0-9_]*\s*)\}/g, (m, g1) => {
    const name = String(g1).trim();
    if (Object.prototype.hasOwnProperty.call(values, name)) {
      return values[name] ?? "";
    }
    return m;
  });

  // 再替换 @name
  // 规则：默认用单引号包裹并转义（生成可直接执行的 SQL 更常用）
  out = out.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (m, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return m;
    const v = values[name] ?? "";
    if (!opt.quoteAtParams) return v;
    return `'${escapeSqlSingleQuoted(v)}'`;
  });

  return out;
}

function escapeCSharpVerbatimContent(text: string): string {
  // verbatim 字符串里：双引号需要写成 ""
  return text.replace(/"/g, '""');
}

export interface ReverseToCSharpOptions {
  /**
   * 生成的变量名，默认 sql
   */
  variableName?: string;
  /**
   * 是否使用插值 verbatim（$@"..."）。默认 true，兼容原始输入风格。
   * 若 false，则生成 @"..."
   */
  interpolated?: boolean;
}

const DEFAULT_REVERSE_OPTIONS: Required<ReverseToCSharpOptions> = {
  variableName: "sql",
  interpolated: true,
};

/**
 * 将 SQL 文本反向生成 C# 代码：var sql = $@"...";（不处理任何外部变量）
 */
export function reverseSqlToCSharpVar(sql: string, options?: ReverseToCSharpOptions): string {
  const opt = { ...DEFAULT_REVERSE_OPTIONS, ...(options ?? {}) };
  const escaped = escapeCSharpVerbatimContent(sql ?? "");
  const prefix = opt.interpolated ? '$@"' : '@"';
  return `var ${opt.variableName} = ${prefix}${escaped}";`;
}
