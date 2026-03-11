// C# 脚本转换工具函数（Next.js 版本）
// 从现有 Vue 项目的 csharp-converter.ts 迁移而来，保持核心行为一致

interface ParseResult {
  classes: string[];
  functions: string[];
  scriptCode: string;
  parameters: string[];
}

/**
 * 从代码中提取参数名
 */
function extractParameters(code: string): string[] {
  const parameters: string[] = [];
  const regex =
    /Global\.Parameters\.FirstOrDefault\s*\(\s*x\s*=>\s*x\.ParameterName\s*==\s*"([^"]+)"\)/g;
  let match = regex.exec(code);

  while (match !== null) {
    const paramName = match[1];
    if (!parameters.includes(paramName)) {
      parameters.push(paramName);
    }
    match = regex.exec(code);
  }

  return parameters;
}

/**
 * 注释掉代码中最后的 return 语句
 */
function commentLastReturn(code: string): string {
  const lines = code.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmedLine = lines[i].trim();
    if (/^\s*return\s+[^;]*;?\s*$/.test(trimmedLine)) {
      if (!trimmedLine.startsWith('//')) {
        const indent = lines[i].match(/^\s*/)?.[0] ?? '';
        lines[i] = `${indent}// ${trimmedLine}`;
      }
      break;
    }
  }
  return lines.join('\n');
}

/**
 * 解析 C# 代码，分离类、函数和脚本代码
 */
export function parseCSharpCode(sourceCode: string): ParseResult {
  const result: ParseResult = {
    classes: [],
    functions: [],
    scriptCode: '',
    parameters: [],
  };

  result.parameters = extractParameters(sourceCode);

  let remainingCode = sourceCode;

  // 提取类定义（public class ... { ... }）
  const classRegex = /public\s+class\s+\w+\s*\{/g;
  const classes: string[] = [];
  let classMatch = classRegex.exec(sourceCode);

  while (classMatch !== null) {
    const startIndex = classMatch.index;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let i = startIndex;

    while (i < sourceCode.length) {
      const char = sourceCode[i];
      const prevChar = i > 0 ? sourceCode[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const classCode = sourceCode.substring(startIndex, i + 1);
            classes.push(classCode.trim());
            remainingCode = remainingCode.replace(classCode, '');
            break;
          }
        }
      }
      i++;
    }
    classMatch = classRegex.exec(sourceCode);
  }

  result.classes = classes;

  // 提取函数定义
  const accessModifierRegex =
    /(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?/g;
  const functions: string[] = [];
  let modifierMatch = accessModifierRegex.exec(sourceCode);

  while (modifierMatch !== null) {
    const methodStart = modifierMatch.index;
    let i = methodStart + modifierMatch[0].length;
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let foundMethodName = false;
    let paramListEnd = -1;
    let methodBodyStart = -1;

    while (i < sourceCode.length) {
      const char = sourceCode[i];
      const prevChar = i > 0 ? sourceCode[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(') {
          parenDepth++;
          if (foundMethodName && parenDepth === 1) {
            let j = i + 1;
            let paramParenDepth = 1;
            let paramInString = false;
            let paramStringChar = '';

            while (j < sourceCode.length && paramParenDepth > 0) {
              const c = sourceCode[j];
              const p = j > 0 ? sourceCode[j - 1] : '';

              if ((c === '"' || c === "'") && p !== '\\') {
                if (!paramInString) {
                  paramInString = true;
                  paramStringChar = c;
                } else if (c === paramStringChar) {
                  paramInString = false;
                }
              }

              if (!paramInString) {
                if (c === '(') paramParenDepth++;
                else if (c === ')') {
                  paramParenDepth--;
                  if (paramParenDepth === 0) {
                    paramListEnd = j;
                    break;
                  }
                }
              }
              j++;
            }

            j++;
            while (j < sourceCode.length && /\s/.test(sourceCode[j])) {
              j++;
            }
            if (j < sourceCode.length && sourceCode[j] === '{') {
              methodBodyStart = j;
              break;
            }
          }
        } else if (char === ')') {
          parenDepth--;
        } else if (char === '[') {
          bracketDepth++;
        } else if (char === ']') {
          bracketDepth--;
        } else if (char === '<') {
          angleDepth++;
        } else if (char === '>') {
          angleDepth--;
        } else if (char === '{' && foundMethodName && paramListEnd > 0) {
          methodBodyStart = i;
          break;
        } else if (
          !foundMethodName &&
          parenDepth === 0 &&
          bracketDepth === 0 &&
          angleDepth === 0 &&
          /\w/.test(char)
        ) {
          const remaining = sourceCode.substring(i);
          const methodNameMatch = remaining.match(/^(\w+)\s*\(/);
          if (methodNameMatch) {
            foundMethodName = true;
            i += methodNameMatch[1].length - 1;
          }
        }
      }
      i++;
    }

    if (methodBodyStart > 0) {
      let braceCount = 0;
      inString = false;
      i = methodBodyStart;

      while (i < sourceCode.length) {
        const char = sourceCode[i];
        const prevChar = i > 0 ? sourceCode[i - 1] : '';

        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
        }

        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const funcCode = sourceCode.substring(methodStart, i + 1);
              if (!funcCode.includes('class ')) {
                functions.push(funcCode.trim());
                remainingCode = remainingCode.replace(funcCode, '');
              }
              break;
            }
          }
        }
        i++;
      }
    }

    modifierMatch = accessModifierRegex.exec(sourceCode);
  }

  result.functions = functions;

  let scriptCode = remainingCode.trim();
  scriptCode = commentLastReturn(scriptCode);
  result.scriptCode = scriptCode;

  return result;
}

/**
 * 生成完整的 C# 文件
 */
export function generateCSharpFile(parseResult: ParseResult): string {
  const usings = `using Azure;
using Dm;
using FreeRedis;
using MiniExcelLibs;
using Newtonsoft.Json;
using OfficeOpenXml;
using OfficeOpenXml.Drawing;
using SqlSugar;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using static System.Runtime.InteropServices.JavaScript.JSType;`;

  const namespaceStart = `namespace BIScriptTest
{`;

  const classesSection = parseResult.classes
    .map((cls) => `    ${cls}`)
    .join('\n\n');

  const parametersSection = parseResult.parameters
    .map((param) => `            Global.Parameters.Add(new SugarParameter("${param}", ""));`)
    .join('\n');

  const functionsSection = parseResult.functions
    .map((func) => {
      let staticFunc = func;
      if (!staticFunc.includes('static ')) {
        staticFunc = staticFunc.replace(
          /(public|private|protected|internal)\s+/,
          '$1 static ',
        );
      }
      if (!staticFunc.includes('public')) {
        staticFunc = staticFunc.replace(
          /(private|protected|internal)\s+static\s+/,
          'public static ',
        );
      }
      return `        ${staticFunc}`;
    })
    .join('\n\n');

  const scriptLines = parseResult.scriptCode.split('\n');
  const indentedScript = scriptLines
    .map((line) => {
      if (line.trim()) {
        const trimmed = line.trim();
        const existingIndent = line.length - trimmed.length;
        if (existingIndent === 0) {
          return `            ${trimmed}`;
        }
        return line;
      }
      return line;
    })
    .join('\n');

  const mainMethod = `    internal class Program
    {
        static async Task Main(string[] args)
        {
            var Global = new Global();
            Global.SqlManager = new SqlSugarManager("User ID=postgres;Password=yOW#tq0Hfm;Host=172.16.26.88;Port=5432;Database=V5MESPro;Pooling=true;Connection Lifetime=0;", SqlSugar.DbType.PostgreSQL);
            //Global.SqlManager = new SqlSugarManager("server=10.0.164.73;database=Kinetic;uid=vbi;pwd=xT(9Qe#upELz;connection timeout=1200;TrustServerCertificate=True", SqlSugar.DbType.SqlServer);

            Global.Parameters = new List<SugarParameter>();
            
${parametersSection ? `${parametersSection}\n` : ''}            #region script code remove res
${indentedScript}

            #endregion
        }${functionsSection ? `\n${functionsSection}` : ''}
    }`;

  const namespaceEnd = `}`;

  const parts = [
    usings,
    '',
    namespaceStart,
    classesSection ? `${classesSection}\n\n` : '',
    mainMethod,
    namespaceEnd,
  ].filter(Boolean);

  return parts.join('\n');
}

/**
 * 转换 C# 脚本为可运行的 .cs 文件
 */
export function convertCSharpScript(sourceCode: string): string {
  const parseResult = parseCSharpCode(sourceCode);
  return generateCSharpFile(parseResult);
}

/**
 * 反向转换：将转换后的 C# 文件还原为原始脚本格式
 */
export function reverseConvertCSharpFile(convertedCode: string): string {
  const result: string[] = [];

  const namespaceMatch = convertedCode.match(/namespace\s+\w+\s*\{([\s\S]*)\}/);
  if (!namespaceMatch) {
    throw new Error('无法找到 namespace 定义');
  }

  const namespaceContent = namespaceMatch[1];

  const classRegex = /public\s+class\s+\w+\s*\{/g;
  let classMatch = classRegex.exec(namespaceContent);

  while (classMatch !== null) {
    const startIndex = classMatch.index;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let i = startIndex;

    while (i < namespaceContent.length) {
      const char = namespaceContent[i];
      const prevChar = i > 0 ? namespaceContent[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const classCode = namespaceContent.substring(startIndex, i + 1);
            if (!classCode.includes('class Program')) {
              const unindentedClass = classCode
                .split('\n')
                .map((line) => {
                  if (line.trim()) {
                    return line.replace(/^ {4}/, '');
                  }
                  return line;
                })
                .join('\n')
                .trim();
              result.push(unindentedClass);
            }
            break;
          }
        }
      }
      i++;
    }
    classMatch = classRegex.exec(namespaceContent);
  }

  const programClassRegex = /internal\s+class\s+Program\s*\{/;
  const programClassMatch = namespaceContent.match(programClassRegex);

  if (programClassMatch && programClassMatch.index !== undefined) {
    const programStart = programClassMatch.index;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let i = programStart;

    while (i < namespaceContent.length) {
      const char = namespaceContent[i];
      const prevChar = i > 0 ? namespaceContent[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const programContent = namespaceContent.substring(programStart, i + 1);

            const staticMethodRegex = /public\s+static\s+(?!async\s+Task\s+Main)/g;
            let methodMatch = staticMethodRegex.exec(programContent);

            while (methodMatch !== null) {
              const methodStart = methodMatch.index;
              let methodBraceCount = 0;
              let methodInString = false;
              let methodStringChar = '';
              let j = methodStart;

              while (j < programContent.length && programContent[j] !== '{') {
                j++;
              }

              if (j < programContent.length) {
                methodBraceCount = 1;
                j++;

                while (j < programContent.length && methodBraceCount > 0) {
                  const c = programContent[j];
                  const p = j > 0 ? programContent[j - 1] : '';

                  if ((c === '"' || c === "'") && p !== '\\') {
                    if (!methodInString) {
                      methodInString = true;
                      methodStringChar = c;
                    } else if (c === methodStringChar) {
                      methodInString = false;
                    }
                  }

                  if (!methodInString) {
                    if (c === '{') methodBraceCount++;
                    else if (c === '}') {
                      methodBraceCount--;
                      if (methodBraceCount === 0) {
                        let methodCode = programContent.substring(methodStart, j + 1);

                        methodCode = methodCode.replace(
                          /public\s+static\s+/,
                          'public ',
                        );

                        const unindentedMethod = methodCode
                          .split('\n')
                          .map((line) => {
                            if (line.trim()) {
                              return line.replace(/^ {8}/, '');
                            }
                            return line;
                          })
                          .join('\n')
                          .trim();

                        if (unindentedMethod) {
                          result.push(unindentedMethod);
                        }
                        break;
                      }
                    }
                  }
                  j++;
                }
              }

              methodMatch = staticMethodRegex.exec(programContent);
            }
            break;
          }
        }
      }
      i++;
    }
  }

  const regionMatch = convertedCode.match(
    /#region\s+script\s+code\s+remove\s+res\s*([\s\S]*?)\s*#endregion/,
  );
  if (regionMatch) {
    const scriptCode = regionMatch[1].trim();

    const unindentedScript = scriptCode
      .split('\n')
      .map((line) => {
        if (line.trim()) {
          return line.replace(/^ {12}/, '');
        }
        return line;
      })
      .join('\n')
      .trim();

    const restoredScript = unindentedScript.replace(
      /\/\/\s*return\s+([^;]+);?/g,
      'return $1;',
    );

    result.push(restoredScript);
  }

  return result.join('\n\n');
}

