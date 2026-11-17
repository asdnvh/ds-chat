import type { CustomTool } from '../api/types.js'

/**
 * 客户端文件生成工具。只在用户明确要求生成/导出文件时声明：
 * 自定义工具不能与 deepseek_web_search / deepseek_read_url / safety_check / title 同时使用。
 */
export const CREATE_FILE_TOOL: CustomTool = {
  name: 'create_file',
  description: [
    '当用户明确要求生成、创建、导出或下载一个文件（文档、表格、幻灯片、PDF、文本等）时调用此工具。',
    '调用后文件会直接出现在聊天里供用户下载。content 必须是文件的完整内容，不要省略或用占位符。',
    '格式说明：',
    'md/txt/html/pdf/docx/pptx 的 content 使用 Markdown（# 标题、- 列表、空行分段；pptx 用单独一行 --- 分页）；',
    'csv/xlsx 的 content 使用 CSV（逗号分隔，第一行为表头）；json 的 content 必须是合法 JSON。',
  ].join('\n'),
  input_schema: {
    type: 'object',
    properties: {
      file_type: {
        type: 'string',
        enum: ['md', 'txt', 'csv', 'json', 'html', 'docx', 'xlsx', 'pptx', 'pdf'],
        description: '文件类型',
      },
      filename: {
        type: 'string',
        description: '文件名（不含路径），如 项目周报.docx',
      },
      content: {
        type: 'string',
        description: '文件完整内容，按 file_type 的格式要求',
      },
    },
    required: ['file_type', 'filename', 'content'],
  },
}

/** 文件类型关键字：用于判断用户消息是否在要求生成文件 */
const FILE_TYPE_WORDS: Record<string, string> = {
  docx: 'Word|word|docx|文档|报告|合同|简历|论文|说明书|方案',
  xlsx: 'Excel|excel|xlsx|表格|成绩单|清单|统计表|台账',
  pptx: 'PPT|ppt|pptx|幻灯片|演示文稿|演示',
  pdf: 'PDF|pdf',
  md: 'Markdown|markdown|md',
  txt: 'txt|文本文件',
  csv: 'csv',
  json: 'json',
  html: 'html|网页',
}

const REQUEST_WORDS =
  '生成|创建|导出|下载|制作|做个|做一个|写一个|写一份|写个|给我(一个|一份|个|份)?|整理成|转成|保存为|' +
  'generate|create|export|download|make|write|save as|produce|build'

const hasFileType = (text: string) => {
  for (const words of Object.values(FILE_TYPE_WORDS)) {
    if (new RegExp(`(?:${words})`, 'i').test(text)) {
      return true
    }
  }
  return /文件/.test(text) && /生成|创建|导出|下载|写一份|做一个/.test(text)
}

/** 用户消息是否在明确要求生成/导出文件（只决定是否给模型提供 create_file 工具） */
export const detectFileIntent = (text: string): boolean => {
  if (!text) {
    return false
  }
  return new RegExp(REQUEST_WORDS, 'i').test(text) && hasFileType(text)
}

/** 给模型补充一句约束，避免普通聊天也调用工具 */
export const FILE_TOOL_HINT =
  '\n当用户明确要求生成、创建、导出或下载文件时，调用 create_file 工具生成文件；' +
  '用户没有要求生成文件时不要调用此工具。'
