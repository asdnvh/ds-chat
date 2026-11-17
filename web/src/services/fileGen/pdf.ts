import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string }

const parseMarkdown = (markdown: string): Block[] => {
  const blocks: Block[] = []
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      continue
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line)
    if (bullet) {
      blocks.push({ type: 'bullet', text: bullet[1] })
      continue
    }
    blocks.push({ type: 'paragraph', text: line })
  }
  return blocks
}

let fontBytesPromise: Promise<ArrayBuffer> | null = null

/** 中文字体随应用打包在 dist/fonts 下，首次生成 PDF 时加载并缓存 */
const loadFontBytes = () => {
  fontBytesPromise ??= (async () => {
    const response = await fetch(new URL('/fonts/NotoSansSC-Regular.ttf', location.href).href)
    if (!response.ok) {
      throw new Error('中文字体加载失败')
    }
    return response.arrayBuffer()
  })()
  return fontBytesPromise
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 50
const MAX_PAGES = 80

/** 生成中文 PDF：标题、正文、项目符号，自动换行与分页 */
export const buildPdf = async (markdown: string): Promise<File> => {
  const fontBytes = await loadFontBytes()
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(fontBytes, { subset: true })
  const fallback = await doc.embedFont(StandardFonts.Helvetica)
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN
  const maxWidth = PAGE_WIDTH - MARGIN * 2

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  const wrap = (text: string, size: number): string[] => {
    const lines: string[] = []
    let current = ''
    for (const char of text) {
      const next = current + char
      const width = font.widthOfTextAtSize(next, size)
      if (width > maxWidth && current) {
        lines.push(current)
        current = char === ' ' ? '' : char
      } else {
        current = next
      }
    }
    if (current) {
      lines.push(current)
    }
    return lines.length > 0 ? lines : ['']
  }

  const drawLines = (text: string, size: number, indent = 0) => {
    for (const line of wrap(text, size)) {
      if (y < MARGIN + size * 2) {
        if (doc.getPageCount() >= MAX_PAGES) {
          return
        }
        newPage()
      }
      page.drawText(line, {
        x: MARGIN + indent,
        y,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      })
      y -= size * 1.6
    }
  }

  for (const block of parseMarkdown(markdown)) {
    if (block.type === 'heading') {
      const size = block.level === 1 ? 22 : block.level === 2 ? 17 : 14
      y -= size * 0.5
      drawLines(block.text, size)
      y -= size * 0.4
    } else if (block.type === 'bullet') {
      drawLines(`• ${block.text}`, 11, 12)
    } else {
      drawLines(block.text, 11)
      y -= 6
    }
    if (doc.getPageCount() >= MAX_PAGES) {
      break
    }
  }
  // 未使用到的标准字体仅用于保持 PDF 结构简单；避免 TypeScript 未使用告警
  void fallback
  const bytes = await doc.save()
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new File([copy], 'document.pdf', { type: 'application/pdf' })
}
