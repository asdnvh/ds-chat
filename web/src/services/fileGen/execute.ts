import { createId } from '../../utils/id.js'
import * as db from '../chat/db.js'
import type { FileAttachment, ToolResultPart, ToolUsePart } from '../chat/types.js'
import { generateFile } from './generate.js'

const readInput = (input: unknown) => {
  if (!input || typeof input !== 'object') {
    throw new Error('工具参数格式不正确')
  }
  const record = input as Record<string, unknown>
  if (
    typeof record.file_type !== 'string' ||
    typeof record.filename !== 'string' ||
    typeof record.content !== 'string'
  ) {
    throw new Error('缺少 file_type / filename / content 参数')
  }
  return {
    file_type: record.file_type,
    filename: record.filename,
    content: record.content,
  }
}

/**
 * 执行一次 create_file 工具调用：生成文件、把原件写入 IndexedDB，
 * 返回给模型的 tool_result 和挂在助手消息上的附件。
 */
export const executeCreateFile = async (
  use: ToolUsePart
): Promise<{ result: ToolResultPart; attachment: FileAttachment | null }> => {
  try {
    const input = readInput(use.input)
    const { file } = await generateFile(input)
    const id = createId()
    await db.saveFiles([{ id, blob: file }])
    const attachment: FileAttachment = {
      id,
      serverIds: [],
      name: file.name,
      size: file.size,
      isImage: false,
      mimeType: file.type || 'application/octet-stream',
    }
    return {
      result: {
        type: 'tool_result',
        toolUseId: use.id,
        content: JSON.stringify({ ok: true, filename: file.name, size: file.size }),
      },
      attachment,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[dschat-tool] create_file 失败: ${message}`)
    return {
      result: {
        type: 'tool_result',
        toolUseId: use.id,
        content: `生成文件失败：${message}。请不要重试同一个工具调用，改为向用户说明原因。`,
        isError: true,
      },
      attachment: null,
    }
  }
}
