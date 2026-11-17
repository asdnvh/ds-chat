import { zipSync, strToU8 } from 'fflate'
import { buildPptx } from './pptx.js'
import { buildPdf } from './pdf.js'

/** XML 文本转义 */
const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** 从 Markdown 风格文本解析出块：标题、项目符号、编号、正文 */
type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'ordered'; index: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] }

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())

const parseMarkdown = (markdown: string): Block[] => {
  const blocks: Block[] = []
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) {
      i++
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      i++
      continue
    }
    // Markdown 表格：表头 + 分隔行 + 若干行
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
      const rows: string[][] = [splitRow(trimmed)]
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ type: 'table', rows })
      continue
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed)
    if (bullet) {
      blocks.push({ type: 'bullet', text: bullet[1] })
      i++
      continue
    }
    const ordered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed)
    if (ordered) {
      blocks.push({ type: 'ordered', index: Number(ordered[1]), text: ordered[2] })
      i++
      continue
    }
    blocks.push({ type: 'paragraph', text: trimmed })
    i++
  }
  return blocks
}

/** 生成 word/document.xml 的段落集合 */
const docxParagraphs = (blocks: Block[]): string => {
  const out: string[] = []
  const para = (runs: string, style?: string) =>
    `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${runs}</w:p>`
  for (const block of blocks) {
    if (block.type === 'heading') {
      const size = block.level === 1 ? 36 : block.level === 2 ? 30 : 26
      out.push(
        `<w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>` +
          `<w:r><w:rPr><w:b/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(block.text)}</w:t></w:r></w:p>`
      )
    } else if (block.type === 'bullet') {
      out.push(
        para(
          `<w:r><w:t xml:space="preserve">• ${escapeXml(block.text)}</w:t></w:r>`
        ).replace('<w:p>', '<w:p><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr>')
      )
    } else if (block.type === 'ordered') {
      out.push(
        para(
          `<w:r><w:t xml:space="preserve">${block.index}. ${escapeXml(block.text)}</w:t></w:r>`
        ).replace('<w:p>', '<w:p><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr>')
      )
    } else if (block.type === 'table') {
      for (const row of block.rows) {
        out.push(
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(row.join(' | '))}</w:t></w:r></w:p>`
        )
      }
    } else {
      out.push(`<w:p><w:r><w:t xml:space="preserve">${escapeXml(block.text)}</w:t></w:r></w:p>`)
    }
  }
  return out.join('')
}

const docxFiles = (markdown: string): Record<string, Uint8Array> => {
  const body = docxParagraphs(parseMarkdown(markdown))
  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>`
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`
  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`
  return {
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rels),
    'word/document.xml': strToU8(documentXml),
  }
}

/** 解析 CSV：支持双引号包裹的字段 */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

const columnName = (index: number) => {
  let name = ''
  let value = index
  while (value >= 0) {
    name = String.fromCharCode(65 + (value % 26)) + name
    value = Math.floor(value / 26) - 1
  }
  return name
}

const xlsxFiles = (csv: string): Record<string, Uint8Array> => {
  const rows = parseCsv(csv)
  const sheetRows = rows
    .map((cells, rowIndex) => {
      const cellXml = cells
        .map((value, columnIndex) => {
          if (value === '') {
            return ''
          }
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`
          const numeric = /^-?\d+(\.\d+)?$/.test(value.trim())
          return numeric
            ? `<c r="${ref}"><v>${value.trim()}</v></c>`
            : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${rowIndex + 1}">${cellXml}</row>`
    })
    .join('')
  const worksheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${sheetRows}</sheetData></worksheet>`
  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`
  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`
  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`
  return {
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rels),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8(workbookRels),
    'xl/worksheets/sheet1.xml': strToU8(worksheet),
  }
}

const MIME_BY_TYPE: Record<string, string> = {
  md: 'text/markdown',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  html: 'text/html',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
}

export type GeneratedFile = { file: File; preview: string }

/**
 * 按工具参数生成文件。未知类型或内容为空时抛错，由调用方把错误作为 tool_result 回给模型。
 */
export const generateFile = async (input: {
  file_type: string
  filename: string
  content: string
}): Promise<GeneratedFile> => {
  const type = input.file_type.toLowerCase()
  const content = input.content
  if (!content || !content.trim()) {
    throw new Error('文件内容为空')
  }
  const maxChars = 300_000
  if (content.length > maxChars) {
    throw new Error(`文件内容过长（${content.length} 字符），请精简到 ${maxChars} 字符以内`)
  }
  const baseName = input.filename.replace(/[\\/:*?"<>|]/g, '_').replace(/\.[^.]+$/, '').trim() || '未命名文件'
  const mime = MIME_BY_TYPE[type]
  if (!mime) {
    throw new Error(`暂不支持生成 ${type} 类型的文件`)
  }
  if (type === 'docx') {
    const bytes = zipSync(docxFiles(content), { level: 6 })
    return {
      file: new File([bytes], `${baseName}.docx`, { type: mime }),
      preview: content.slice(0, 200),
    }
  }
  if (type === 'xlsx') {
    const bytes = zipSync(xlsxFiles(content), { level: 6 })
    return {
      file: new File([bytes], `${baseName}.xlsx`, { type: mime }),
      preview: content.slice(0, 200),
    }
  }
  if (type === 'pptx') {
    const pptx = buildPptx(content)
    return {
      file: new File([pptx], `${baseName}.pptx`, { type: mime }),
      preview: content.slice(0, 200),
    }
  }
  if (type === 'pdf') {
    const pdf = await buildPdf(content)
    return {
      file: new File([pdf], `${baseName}.pdf`, { type: mime }),
      preview: content.slice(0, 200),
    }
  }
  return {
    file: new File([content], `${baseName}.${type}`, { type: mime }),
    preview: content.slice(0, 200),
  }
}
