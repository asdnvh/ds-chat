import { PDFDocument } from 'pdf-lib'

/** 超过该大小的 PDF 先拆分（Files API 单文件实际可上传上限约 49 MiB，网关约 50 MiB） */
export const PDF_SPLIT_THRESHOLD_BYTES = 49 * 1024 * 1024
/** 单个分片的目标大小，给网关与 multipart 开销留余量 */
const PART_TARGET_BYTES = 38 * 1024 * 1024
/** 允许拆分处理的最大 PDF（再大内存与耗时都不可控） */
export const MAX_PDF_BYTES = 300 * 1024 * 1024

export const needsPdfSplit = (file: File) =>
  /\.pdf$/i.test(file.name) && file.size > PDF_SPLIT_THRESHOLD_BYTES

/**
 * 按页把大 PDF 拆成多个 < 49 MiB 的分片：网关对单请求体限制约 50 MiB，
 * 拆分后分别上传，再用多个 file_id 一起引用。
 * 通过平均每页字节数估算每片页数，避免逐页测量带来的额外内存开销。
 */
export const splitPdf = async (file: File): Promise<File[]> => {
  const source = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
    ignoreEncryption: true,
    updateMetadata: false,
  })
  const pageCount = source.getPageCount()
  if (pageCount === 0) {
    throw new Error('PDF 没有可提取的页面')
  }
  const averagePageBytes = Math.ceil(file.size / pageCount)
  const pagesPerPart = Math.max(1, Math.floor(PART_TARGET_BYTES / averagePageBytes))
  const baseName = file.name.replace(/\.pdf$/i, '')
  const parts: File[] = []
  for (let start = 0; start < pageCount; start += pagesPerPart) {
    const end = Math.min(pageCount, start + pagesPerPart)
    const target = await PDFDocument.create()
    const pages = await target.copyPages(
      source,
      Array.from({ length: end - start }, (_, index) => start + index)
    )
    pages.forEach((page) => target.addPage(page))
    const bytes = await target.save()
    const bytesCopy = new Uint8Array(bytes.length)
    bytesCopy.set(bytes)
    parts.push(
      new File([bytesCopy], `${baseName} (part ${parts.length + 1}).pdf`, {
        type: 'application/pdf',
      })
    )
  }
  console.info(
    `[dschat-upload] PDF 拆分完成 pages=${pageCount} parts=${parts.length} bytes=${file.size}`
  )
  return parts
}
