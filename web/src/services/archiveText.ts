import { Archive } from 'libarchive.js'

/** 服务端能按文本解析的扩展名（压缩包内只提取这些文件） */
const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'html', 'htm',
  'css', 'scss', 'less', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'h',
  'cpp', 'hpp', 'cc', 'cs', 'go', 'rs', 'rb', 'php', 'sh', 'bash', 'bat', 'cmd', 'ps1',
  'sql', 'ini', 'conf', 'cfg', 'log', 'srt', 'vtt', 'tex', 'gradle', 'properties', 'toml',
  'dockerfile', 'kt', 'kts', 'swift', 'lua', 'pl', 'r', 'm', 'mm', 'vue', 'svelte', 'gitignore',
])

const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z'])
export const isArchiveName = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 && ARCHIVE_EXTS.has(name.slice(dot + 1).toLowerCase())
}

/** 单个文本文件最多读取的字节数，避免超大文件撑爆内存 */
const PER_FILE_MAX_BYTES = 1024 * 1024
/** 单个文件最多拼接的字符数 */
const PER_FILE_MAX_CHARS = 4000
/**
 * 拼接后的文本总长度上限。模型上下文只有 32768 tokens，
 * 8MB 的聊天归档会膨胀成上百万字符，必须在本地截断，否则请求必然超长失败。
 */
const TOTAL_MAX_CHARS = 12000

let initialized = false
const initArchive = () => {
  if (initialized) {
    return
  }
  // worker 与 wasm 由构建复制到 dist/libarchive/，相对站点根路径加载
  Archive.init({ workerUrl: new URL('/libarchive/worker-bundle.js', location.href).href })
  initialized = true
}

/** 从压缩包（zip/rar/7z）中提取文本类文件，拼成一份可供模型阅读的纯文本附件 */
export const extractArchiveText = async (file: File): Promise<File | null> => {
  initArchive()
  const archive = await Archive.open(file)
  try {
    const entries = (await archive.getFilesArray()) as {
      file: { name: string; size: number; extract: () => Promise<File> }
      path: string
    }[]
    const pieces: string[] = []
    let total = 0
    let extracted = 0
    for (const entry of entries) {
      const name = entry.file.name
      const dot = name.lastIndexOf('.')
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
      if (!TEXT_EXTS.has(ext)) {
        continue
      }
      if (entry.file.size > PER_FILE_MAX_BYTES) {
        continue
      }
      const path = entry.path ? `${entry.path}${name}` : name
      try {
        const extractedFile = await entry.file.extract()
        const text = await extractedFile.text()
        if (!text.trim()) {
          continue
        }
        const body =
          text.length > PER_FILE_MAX_CHARS
            ? `${text.slice(0, PER_FILE_MAX_CHARS)}\n...(该文件已截断)`
            : text
        const piece = `\n===== ${path} =====\n${body}`
        if (total + piece.length > TOTAL_MAX_CHARS) {
          const rest = Math.max(0, TOTAL_MAX_CHARS - total)
          pieces.push(`${piece.slice(0, rest)}\n...(压缩包内容过多，仅提取了前 ${TOTAL_MAX_CHARS} 字符)`)
          break
        }
        pieces.push(piece)
        total += piece.length
        extracted++
      } catch {
        // 单个文件解压失败不影响其他文件
      }
    }
    if (pieces.length === 0) {
      return null
    }
    const header = `以下是压缩包 ${file.name} 中提取的文本内容（共 ${extracted} 个文本文件；图片/二进制文件未提取）：\n`
    const baseName = file.name.replace(/\.(zip|rar|7z)$/i, '')
    return new File([header + pieces.join('\n')], `${baseName}_contents.txt`, {
      type: 'text/plain',
    })
  } finally {
    await archive.close().catch(() => {})
  }
}
