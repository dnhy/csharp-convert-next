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

  // 提取类定义（public class ... { ... }），包括类前面的特性
  const classRegex = /public\s+class\s+\w+\s*\{/g;
  const classes: string[] = [];
  let classMatch = classRegex.exec(sourceCode);

  while (classMatch !== null) {
    // 从 class 关键字的位置开始，向前查找特性
    let classStartIndex = classMatch.index;
    
    // 向前查找，找到所有在类定义之前的特性（attributes）
    // 特性格式：[AttributeName(...)] 或 [AttributeName]
    let i = classStartIndex - 1;
    let bracketDepth = 0;
    let inString = false;
    let stringChar = '';
    let foundAttribute = false;
    
    // 跳过空白字符
    while (i >= 0 && /\s/.test(sourceCode[i])) {
      i--;
    }
    
    // 向前查找特性
    while (i >= 0) {
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
        if (char === ']') {
          bracketDepth++;
          foundAttribute = true;
        } else if (char === '[') {
          bracketDepth--;
          if (bracketDepth === 0 && foundAttribute) {
            // 找到了特性的开始
            classStartIndex = i;
            break;
          }
        } else if (bracketDepth === 0 && !/\s/.test(char)) {
          // 如果没有找到特性，或者已经跳出了特性范围
          break;
        }
      }
      i--;
    }
    
    // 现在提取完整的类定义（包括特性）
    let braceCount = 0;
    inString = false;
    stringChar = '';
    i = classStartIndex;

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
            const classCode = sourceCode.substring(classStartIndex, i + 1);
            classes.push(classCode.trim());
            // 使用正则替换，确保完全移除类代码（包括所有空白字符）
            const classCodeRegex = new RegExp(
              classCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'g'
            );
            remainingCode = remainingCode.replace(classCodeRegex, '');
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
  // 只提取有参数列表 () 的函数，排除属性（属性只有 { get; set; }）
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

    // 跳过特性（attributes）
    while (i < sourceCode.length && sourceCode[i] === '[') {
      let attrBracketDepth = 0;
      let attrInString = false;
      let attrStringChar = '';
      let j = i;
      
      while (j < sourceCode.length) {
        const c = sourceCode[j];
        const p = j > 0 ? sourceCode[j - 1] : '';
        
        if ((c === '"' || c === "'") && p !== '\\') {
          if (!attrInString) {
            attrInString = true;
            attrStringChar = c;
          } else if (c === attrStringChar) {
            attrInString = false;
          }
        }
        
        if (!attrInString) {
          if (c === '[') attrBracketDepth++;
          else if (c === ']') {
            attrBracketDepth--;
            if (attrBracketDepth === 0) {
              j++;
              // 跳过空白
              while (j < sourceCode.length && /\s/.test(sourceCode[j])) {
                j++;
              }
              i = j;
              break;
            }
          }
        }
        j++;
      }
      if (j >= sourceCode.length) break;
    }

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
          // 支持泛型方法名：Method<T>(...) / Method<TKey, TValue>(...)
          // 这里我们只需要判断“当前位置是否是方法名起始”，因此允许可选的 <...> 出现在方法名和 '(' 之间
          const methodNameMatch = remaining.match(/^(\w+)(?:<[^>]+>)?\s*\(/);
          if (methodNameMatch) {
            foundMethodName = true;
            i += methodNameMatch[1].length - 1;
          } else {
            // 如果没有找到方法名和 (，可能是属性，跳过
            // 检查是否是属性：public Type name { get; set; } 或 public Type? name { get; set; }
            // 属性模式：类型名 + 空格 + 属性名 + 空格 + {
            const propertyMatch = remaining.match(/^[\w<>?[\],\s]+\s+\w+\s*\{/);
            if (propertyMatch) {
              // 这是属性，不是函数，跳过这个匹配
              break;
            }
            // 也检查是否是字段：public Type name;（没有 { get; set; }）
            const fieldMatch = remaining.match(/^[\w<>?[\],\s]+\s+\w+\s*;/);
            if (fieldMatch) {
              // 这是字段，不是函数，跳过
              break;
            }
          }
        }
      }
      i++;
    }

    // 只有找到参数列表 () 的才被认为是函数
    // 属性只有 { get; set; }，没有 ()，所以会被排除
    if (methodBodyStart > 0 && paramListEnd > 0 && foundMethodName) {
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
export function generateCSharpFile(
  parseResult: ParseResult,
  connectionString: string = "User ID=postgres;Password=yOW#tq0Hfm;Host=172.16.26.88;Port=5432;Database=V5MESPro;Pooling=true;Connection Lifetime=0;",
  dbType: string = "PostgreSQL"
): string {
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

  // 格式化类定义，确保缩进正确（namespace 内部：4个空格，类内部：8个空格）
  const classesSection = parseResult.classes
    .map((cls) => {
      // 为类中的方法添加 static 关键字（仅针对具有参数列表的成员，避免影响字段/属性）
      const clsWithStaticMethods = cls.replace(
        /(public|private|protected|internal)\s+(?!static)(?=(?:\s+async\s+)?[\w<>\[\]?]+\s+\w+\s*\()/g,
        '$1 static ',
      );

      const lines = clsWithStaticMethods.split('\n');
      let braceDepth = 0;
      const formattedLines: string[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          formattedLines.push('');
          continue;
        }
        
        // 先减少缩进（如果以 } 开头）
        if (trimmed.startsWith('}')) {
          braceDepth = Math.max(0, braceDepth - 1);
        }
        
        // 计算缩进：namespace 内部（4） + 类内部（braceDepth * 4）
        const indent = ' '.repeat(4 + braceDepth * 4);
        formattedLines.push(indent + trimmed);
        
        // 增加缩进（如果以 { 结尾）
        if (trimmed.endsWith('{')) {
          braceDepth++;
        }
      }
      
      return formattedLines.join('\n');
    })
    .join('\n\n');

  const parametersSection = parseResult.parameters
    .map((param) => `            Global.Parameters.Add(new SugarParameter("${param}", ""));`)
    .join('\n');

  // 格式化函数，确保缩进正确（Program 类内部：8个空格）
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
      
      // 规范化函数缩进
      const lines = staticFunc.split('\n');
      let funcBraceDepth = 0;
      const formattedLines: string[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          formattedLines.push('');
          continue;
        }
        
        // 先减少缩进（如果以 } 开头）
        if (trimmed.startsWith('}')) {
          funcBraceDepth = Math.max(0, funcBraceDepth - 1);
        }
        
        // 计算缩进：namespace(4) + class(4) + 块深度(funcBraceDepth * 4)
        const indent = ' '.repeat(8 + funcBraceDepth * 4);
        formattedLines.push(indent + trimmed);
        
        // 增加缩进（如果以 { 结尾）
        if (trimmed.endsWith('{')) {
          funcBraceDepth++;
        }
      }
      
      return formattedLines.join('\n');
    })
    .join('\n\n');

  // 格式化脚本代码，确保缩进正确（Main 方法内部：12个空格）
  const scriptLines = parseResult.scriptCode.split('\n');
  let scriptBraceDepth = 0;
  const indentedScript = scriptLines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // 先减少缩进（如果以 } 开头）
      if (trimmed.startsWith('}')) {
        scriptBraceDepth = Math.max(0, scriptBraceDepth - 1);
      }
      
      // 计算缩进：namespace(4) + class(4) + method(4) + 块深度(scriptBraceDepth * 4)
      const indent = ' '.repeat(12 + scriptBraceDepth * 4);
      const result = indent + trimmed;
      
      // 增加缩进（如果以 { 结尾）
      if (trimmed.endsWith('{')) {
        scriptBraceDepth++;
      }
      
      return result;
    })
    .join('\n');

  const mainMethod = `    internal class Program
    {
        // 提供给静态方法/脚本代码共享的全局上下文（避免 Main 内部局部变量遮蔽）
        public static Global Global = new Global();

        static async Task Main(string[] args)
        {
            Global.SqlManager = new SqlSugarManager("${connectionString.replace(/"/g, '\\"')}", SqlSugar.DbType.${dbType});

            Global.Parameters = new List<SugarParameter>();
            
${parametersSection ? `${parametersSection}\n` : ''}            #region script code remove res
            //var id = Global.Parameters.FirstOrDefault(x => x.ParameterName == "Id")?.Value?.ToString();
            
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
export function convertCSharpScript(
  sourceCode: string,
  connectionString?: string,
  dbType?: string
): string {
  const parseResult = parseCSharpCode(sourceCode);
  return generateCSharpFile(parseResult, connectionString, dbType);
}

/**
 * 反向转换：将转换后的 C# 文件还原为原始脚本格式
 */
export function reverseConvertCSharpFile(convertedCode: string): string {
  const result: string[] = [];

  // 查找 namespace 关键字
  const namespaceNameMatch = convertedCode.match(/namespace\s+([\w.]+)/);
  if (!namespaceNameMatch || namespaceNameMatch.index === undefined) {
    throw new Error('无法找到 namespace 定义');
  }

  // 从 namespace 名称后开始查找 {
  const namespaceNameEnd = namespaceNameMatch.index + namespaceNameMatch[0].length;
  const remainingCode = convertedCode.substring(namespaceNameEnd);
  const braceIndex = remainingCode.search(/\{/);
  if (braceIndex === -1) {
    throw new Error('无法找到 namespace 的开始大括号');
  }

  // namespaceStart 指向 { 之后的位置（namespace 内容的开始）
  const namespaceStart = namespaceNameEnd + braceIndex + 1;
  let braceCount = 1; // 从 namespace 的 { 开始计数
  let inString = false;
  let stringChar = '';
  let i = namespaceStart;

  // 计算大括号深度，找到 namespace 的结束位置
  while (i < convertedCode.length && braceCount > 0) {
    const char = convertedCode[i];
    const prevChar = i > 0 ? convertedCode[i - 1] : '';

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
      }
    }
    i++;
  }

  if (braceCount !== 0) {
    throw new Error('无法找到 namespace 的结束位置');
  }

  // namespaceContent 是 namespace { ... } 内部的内容
  const namespaceContent = convertedCode.substring(namespaceStart, i - 1);

  const classRegex = /public\s+class\s+\w+\s*\{/g;
  let classMatch = classRegex.exec(namespaceContent);

  while (classMatch !== null) {
    // 从 class 关键字的位置开始，向前查找特性
    let classStartIndex = classMatch.index;
    
    // 向前查找，找到所有在类定义之前的特性（attributes）
    let i = classStartIndex - 1;
    let bracketDepth = 0;
    let inString = false;
    let stringChar = '';
    let foundAttribute = false;
    
    // 跳过空白字符
    while (i >= 0 && /\s/.test(namespaceContent[i])) {
      i--;
    }
    
    // 向前查找特性
    while (i >= 0) {
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
        if (char === ']') {
          bracketDepth++;
          foundAttribute = true;
        } else if (char === '[') {
          bracketDepth--;
          if (bracketDepth === 0 && foundAttribute) {
            // 找到了特性的开始
            classStartIndex = i;
            break;
          }
        } else if (bracketDepth === 0 && !/\s/.test(char)) {
          // 如果没有找到特性，或者已经跳出了特性范围
          break;
        }
      }
      i--;
    }
    
    // 现在提取完整的类定义（包括特性）
    let braceCount = 0;
    inString = false;
    stringChar = '';
    i = classStartIndex;

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
            let classCode = namespaceContent.substring(classStartIndex, i + 1);
            // 去除类中方法上的 static 关键字（仅针对具有参数列表的成员，避免影响字段/属性）
            classCode = classCode.replace(
              /(public|private|protected|internal)\s+static\s+(?=(?:\s+async\s+)?[\w<>\[\]?]+\s+\w+\s*\()/g,
              '$1 ',
            );
            if (!classCode.includes('class Program')) {
              // 去除 namespace 级别的缩进（4个空格），规范化缩进
              const lines = classCode.split('\n');
              let braceDepth = 0;
              const formattedLines: string[] = [];
              
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                  formattedLines.push('');
                  continue;
                }
                
                // 先减少缩进（如果以 } 开头）
                if (trimmed.startsWith('}')) {
                  braceDepth = Math.max(0, braceDepth - 1);
                }
                
                // 计算缩进：去除 namespace 的4个空格，保持类内部的相对缩进
                const indent = ' '.repeat(braceDepth * 4);
                formattedLines.push(indent + trimmed);
                
                // 增加缩进（如果以 { 结尾）
                if (trimmed.endsWith('{')) {
                  braceDepth++;
                }
              }
              
              result.push(formattedLines.join('\n').trim());
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

  // 提取 Program 类中的 public static 方法（例如 GetParamValue），还原为脚本中的独立方法
  if (programClassMatch && programClassMatch.index !== undefined) {
    const programStart = programClassMatch.index;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let i = programStart;

    // 先找到整个 Program 类的内容区间
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

            // 在 Program 类内部查找 public static 方法（排除 async Task Main）
            // 支持返回类型 + 方法名 + 可选泛型参数，例如：
            // public static T GetParamValue<T>(string paramName)
            const staticMethodRegex =
              /public\s+static\s+(?!async\s+Task\s+Main)[\w<>\[\]?]+\s+\w+(?:<[^>]+>)?\s*\(/g;

            let methodMatch = staticMethodRegex.exec(programContent);

            while (methodMatch) {
              const methodStart = methodMatch.index;
              let j = methodStart;

              // 找到方法体起始的 '{'
              while (j < programContent.length && programContent[j] !== '{') {
                j++;
              }

              if (j >= programContent.length) {
                break;
              }

              // 从 '{' 开始匹配到对应的 '}'
              let methodBraceCount = 0;
              inString = false;
              stringChar = '';
              let k = j;

              while (k < programContent.length) {
                const c = programContent[k];
                const p = k > 0 ? programContent[k - 1] : '';

                if ((c === '"' || c === "'") && p !== '\\') {
                  if (!inString) {
                    inString = true;
                    stringChar = c;
                  } else if (c === stringChar) {
                    inString = false;
                  }
                }

                if (!inString) {
                  if (c === '{') {
                    methodBraceCount++;
                  } else if (c === '}') {
                    methodBraceCount--;
                    if (methodBraceCount === 0) {
                      const methodCode = programContent.substring(methodStart, k + 1);

                      // 去除 Program 类内部的缩进（8 个空格），还原为顶级方法格式
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
                        // 还原为脚本中的独立方法：去掉 Program 中为了编译而添加的 static
                        // 仅去掉访问修饰符后的 static，避免误伤其它上下文
                        const restoredMethod = unindentedMethod.replace(
                          /^(public|private|protected|internal)\s+static\s+/m,
                          '$1 ',
                        );
                        result.push(restoredMethod);
                      }
                      break;
                    }
                  }
                }

                k++;
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

    // 去除 Main 方法级别的缩进（12个空格），规范化缩进
    const lines = scriptCode.split('\n');
    let braceDepth = 0;
    const formattedLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }
      
      // 先减少缩进（如果以 } 开头）
      if (trimmed.startsWith('}')) {
        braceDepth = Math.max(0, braceDepth - 1);
      }
      
      // 计算缩进：去除 Main 方法的12个空格，保持块内部的相对缩进
      const indent = ' '.repeat(braceDepth * 4);
      formattedLines.push(indent + trimmed);
      
      // 增加缩进（如果以 { 结尾）
      if (trimmed.endsWith('{')) {
        braceDepth++;
      }
    }
    
    const unindentedScript = formattedLines.join('\n').trim();

    const restoredScript = unindentedScript.replace(
      /\/\/\s*return\s+([^;]+);?/g,
      'return $1;',
    );

    result.push(restoredScript);
  }

  return result.join('\n\n');
}

