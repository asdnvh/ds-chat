import { create } from 'zustand'
import type { LinkedMessage, TranslationMessage } from '../i18n/index.js'
import { ApiError, uploadFile } from './api/client.js'
import { classifyApiError, getUploadErrorInfo, isRetryableApiError } from './api/errors.js'
import type { FilePurpose } from './api/types.js'
import { ACCEPT_FILE_EXTS } from './uploadExts.js'
import { extractArchiveText, isArchiveName } from './archiveText.js'
import { MAX_PDF_BYTES, needsPdfSplit, splitPdf } from './pdfSplit.js'

/** 允许上传的扩展名：常规清单 + 客户端本地解压的压缩包 */
export const ACCEPTED_EXTS = [...ACCEPT_FILE_EXTS, 'zip', 'rar', '7z']
/** 压缩包在本地解压后只上传提取出的文本，原文件不上传 */
export const MAX_ARCHIVE_MB = 100
/** 选择文件对话框的过滤条件 */
export const ACCEPT = ACCEPTED_EXTS.map((ext) => `.${ext}`).join(',')
/**
 * 单文件大小上限。Files API 文档写的是文档 100 MiB（图片 64 MiB），
 * 但实测网关（openresty）对单个请求体限制约 50 MiB（>~52.4MB 直接 413，且该响应无 CORS 头），
 * 所以客户端按 49 MiB 保守限制，避免发起必然失败的上传。
 * 纯文本、代码、表格、电子书按 user_data 上传，服务器硬上限 32 MiB。
 */
export const MAX_SIZE_MB = 49
export const MAX_IMAGE_SIZE_MB = 49
export const MAX_USER_DATA_SIZE_MB = 32
export const MAX_COUNT = 50
/** 同时上传的文件数 */
const MAX_CONCURRENT = 3

/** 文件扩展名（小写，不含点）；没有扩展名时为空 */
export const getFileExt = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export const isAcceptedExt = (name: string) => ACCEPTED_EXTS.includes(getFileExt(name))

/** 需要服务端做版面解析的文档；其余非图片文件（纯文本、代码、表格、电子书）无需解析 */
const LAYOUT_RECOGNITION_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx'])

/** 上传时的 purpose：图片不传，PDF 与 Word、PPT 做版面解析，其余按 user_data 上传 */
export const getUploadPurpose = (name: string, isImage: boolean): FilePurpose | null => {
  if (isImage) {
    return null
  }
  return LAYOUT_RECOGNITION_EXTS.has(getFileExt(name)) ? 'rich_layout_recognition' : 'user_data'
}

/** 文件允许的最大体积（MB），按上传时的 purpose 区分 */
const getMaxSizeMB = (file: File) => {
  const purpose = getUploadPurpose(file.name, isImage(resolveMimeType(file)))
  if (purpose === 'user_data') {
    return MAX_USER_DATA_SIZE_MB
  }
  if (purpose === 'rich_layout_recognition') {
    return MAX_SIZE_MB
  }
  return MAX_IMAGE_SIZE_MB
}

/** 添加前校验：格式 → 大小 → 数量，任一不满足即整批不添加 */
export const validateFiles = (files: File[], currentCount: number): TranslationMessage | null => {
  if (files.some((file) => !isAcceptedExt(file.name))) {
    return { key: 'uploadUnsupportedFormat' }
  }
  const oversized = files.find((file) => {
    if (isArchiveName(file.name)) {
      return file.size > MAX_ARCHIVE_MB * 1024 * 1024
    }
    if (getFileExt(file.name) === 'pdf') {
      // 大 PDF 会先拆分再上传，允许到拆分上限
      return file.size > MAX_PDF_BYTES
    }
    return file.size > getMaxSizeMB(file) * 1024 * 1024
  })
  if (oversized) {
    const size = isArchiveName(oversized.name) ? MAX_ARCHIVE_MB : getMaxSizeMB(oversized)
    return { key: 'uploadMaxMBSize', params: { size } }
  }
  if (currentCount + files.length > MAX_COUNT) {
    return { key: 'uploadMaxFiles', params: { count: MAX_COUNT } }
  }
  return null
}

/**
 * 上传失败在附件上显示的文案：与设计稿状态对应的用具体原因，其余统一「上传失败」。
 * 服务端原文多为英文且较长，不直接展示。
 */
export const describeUploadError = (error: unknown): TranslationMessage => {
  if (classifyApiError(error) === 'serverBusy') {
    return { key: 'uploadServerBusy' }
  }
  if (classifyApiError(error) === 'tooLarge') {
    return { key: 'uploadTooLarge' }
  }
  if (getUploadErrorInfo(error)?.code === 'parseFailed') {
    return { key: 'uploadParseFailed' }
  }
  return { key: 'uploadFileStatusFailed' }
}

/** 上传失败时把状态码与服务端文案打到 logcat（tag: DSChatWeb），便于真机排查 */
const logUploadFailure = (name: string, size: number, attempt: number, error: unknown) => {
  const detail =
    error instanceof ApiError
      ? { kind: error.kind, status: error.status, message: error.message.slice(0, 300) }
      : { message: error instanceof Error ? error.message.slice(0, 300) : String(error) }
  console.error(
    `[dschat-upload] failed name=${JSON.stringify(name)} bytes=${size} attempt=${attempt} ` +
      `detail=${JSON.stringify(detail)}`
  )
}

/** docx 本地提取文字的最大字符数：模型上下文只有 32768 tokens，超出会整个请求失败 */
const DOCX_TEXT_MAX = 12000

/** docx 就是 ZIP + XML：本地提取 word/document.xml 的纯文字，用于服务端解析失败时兜底 */
const extractDocxText = async (file: File): Promise<File | null> => {
  try {
    const { unzipSync } = await import('fflate')
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => entry.name === 'word/document.xml',
    })
    const xmlBytes = entries['word/document.xml']
    if (!xmlBytes) {
      return null
    }
    const xml = new TextDecoder('utf-8').decode(xmlBytes)
    const text = xml
      .replace(/<w:p[ >]/g, '\n<w:p ')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (!text) {
      return null
    }
    const clipped =
      text.length > DOCX_TEXT_MAX ? `${text.slice(0, DOCX_TEXT_MAX)}\n...(内容过长，已截断)` : text
    const name = file.name.replace(/\.docx$/i, '') + '.txt'
    return new File([clipped], name, { type: 'text/plain' })
  } catch (error) {
    console.warn('[dschat-upload] docx 本地提取失败', error instanceof Error ? error.message : String(error))
    return null
  }
}

const isDocxName = (name: string) => /\.docx$/i.test(name)

/** 服务端无法解析该 docx（400/500/504）时，退化为纯文字上传，保住正文内容 */
const tryDocxTextFallback = async (
  apiKey: string,
  body: File,
  name: string,
  signal: AbortSignal
): Promise<string | null> => {
  if (!isDocxName(name) || signal.aborted) {
    return null
  }
  const textFile = await extractDocxText(body)
  if (!textFile) {
    return null
  }
  console.warn(`[dschat-upload] docx 服务端解析失败，改用本地提取的纯文本上传 name=${JSON.stringify(name)}`)
  const uploaded = await uploadFile(apiKey, textFile, 'user_data', signal)
  return uploaded.id
}
/** 上传失败后自动重试：网络、限流、服务端繁忙/超时，最多 3 次，间隔递增 */
const UPLOAD_MAX_ATTEMPTS = 3
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const uploadWithRetry = async (
  apiKey: string,
  body: File,
  name: string,
  isImage: boolean,
  signal: AbortSignal
): Promise<string> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const file = await uploadFile(apiKey, body, getUploadPurpose(name, isImage), signal)
      if (attempt > 1) {
        console.info(`[dschat-upload] retry succeeded name=${JSON.stringify(name)} attempt=${attempt}`)
      }
      return file.id
    } catch (error) {
      logUploadFailure(name, body.size, attempt, error)
      if (
        !signal.aborted &&
        error instanceof ApiError &&
        [400, 500, 504].includes(error.status ?? 0)
      ) {
        const fallbackId = await tryDocxTextFallback(apiKey, body, name, signal).catch(() => null)
        if (fallbackId) {
          return fallbackId
        }
      }
      if (
        signal.aborted ||
        attempt >= UPLOAD_MAX_ATTEMPTS ||
        !isRetryableApiError(error)
      ) {
        throw error
      }
      await sleep(attempt * 1500)
      if (signal.aborted) {
        throw signal.reason
      }
    }
  }
}

type NoticeListener = (notice: LinkedMessage) => void
const noticeListeners = new Set<NoticeListener>()

/** 订阅需要额外提示的上传失败（配额达到上限），由界面层转成 toast */
export const onUploadNotice = (listener: NoticeListener) => {
  noticeListeners.add(listener)
  return () => {
    noticeListeners.delete(listener)
  }
}

/** 删除已上传文件的接口文档 */
const DELETE_FILE_DOCS_URL = 'https://api-docs.deepseek.com/api/delete-file'

/** 文件数或存储空间达到上限：附件上只放得下「上传失败」，原因另用 toast 说明并引导删除旧文件 */
export const describeUploadQuota = (error: unknown): LinkedMessage | undefined => {
  const info = getUploadErrorInfo(error)
  const link = { key: 'uploadDeleteFiles', href: DELETE_FILE_DOCS_URL } as const
  if (info?.code === 'fileCountLimit') {
    return { type: 'error', key: 'uploadFileCountLimit', params: { limit: info.limit ?? '' }, link }
  }
  if (info?.code === 'storageLimit') {
    return { type: 'error', key: 'uploadStorageLimit', params: { limit: info.limit ?? '' }, link }
  }
  return undefined
}

type Job = () => Promise<void>
const queue: Job[] = []
let running = 0

const next = () => {
  while (running < MAX_CONCURRENT) {
    const job = queue.shift()
    if (!job) {
      return
    }
    running++
    void job().finally(() => {
      running--
      next()
    })
  }
}

/**
 * 排队上传，最多同时上传 MAX_CONCURRENT 个；排队期间中止的任务不会发出请求。
 * 压缩包先在本地解压成文本，大 PDF 先按页拆分，再逐份上传，最终返回多个 file_id。
 */
const enqueueUpload = (
  apiKey: string,
  file: Blob,
  name: string,
  isImage: boolean,
  signal: AbortSignal
) =>
  new Promise<string[]>((resolve, reject) => {
    queue.push(async () => {
      if (signal.aborted) {
        reject(signal.reason)
        return
      }
      try {
        const body = file instanceof File ? file : new File([file], name, { type: file.type })
        const targets: { file: File; isImage: boolean }[] = []
        if (isArchiveName(name)) {
          const textFile = await extractArchiveText(body)
          if (!textFile) {
            throw new ApiError('protocol', '压缩包里没有可读取的文本文件')
          }
          console.info(`[dschat-upload] 压缩包已解压为文本 name=${JSON.stringify(name)}`)
          targets.push({ file: textFile, isImage: false })
        } else if (needsPdfSplit(body)) {
          const parts = await splitPdf(body)
          parts.forEach((part) => targets.push({ file: part, isImage: false }))
        } else {
          targets.push({ file: body, isImage })
        }
        const serverIds: string[] = []
        for (const target of targets) {
          if (signal.aborted) {
            throw signal.reason
          }
          serverIds.push(
            await uploadWithRetry(apiKey, target.file, target.file.name, target.isImage, signal)
          )
        }
        resolve(serverIds)
      } catch (error) {
        reject(error)
      }
    })
    next()
  })

/**
 * 上传任务按附件的本地 id 登记：输入框选中即开始上传，全部成功后携带 serverId 发送，
 * 不会重复上传；导入的历史附件没有任务，发送前按本地原件补传。
 * 任务只在内存里，历史附件补传未完成时，刷新后会在下次请求前重新上传。
 */
export type UploadTask =
  | { status: 'uploading' }
  | { status: 'done'; serverIds: string[] }
  | { status: 'error'; error: TranslationMessage; retryable: boolean }

type UploadState = { tasks: Record<string, UploadTask> }

export const useUploads = create<UploadState>(() => ({ tasks: {} }))

const setTask = (id: string, task: UploadTask | null) =>
  useUploads.setState((state) => ({
    tasks: task
      ? { ...state.tasks, [id]: task }
      : Object.fromEntries(Object.entries(state.tasks).filter(([key]) => key !== id)),
  }))

const pending = new Map<string, { promise: Promise<string[]>; controller: AbortController }>()

/** 开始（或复用进行中的）上传，返回服务端 file_id 列表；失败时任务记为 error 并抛出原错误 */
export const uploadAttachment = (
  apiKey: string,
  id: string,
  blob: Blob,
  name: string,
  isImage: boolean
): Promise<string[]> => {
  const current = pending.get(id)
  if (current) {
    return current.promise
  }
  const controller = new AbortController()
  setTask(id, { status: 'uploading' })
  const promise = enqueueUpload(apiKey, blob, name, isImage, controller.signal)
    .then((serverIds) => {
      setTask(id, { status: 'done', serverIds })
      return serverIds
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        setTask(id, null)
      } else {
        setTask(id, {
          status: 'error',
          error: describeUploadError(error),
          retryable: isRetryableApiError(error),
        })
        const notice = describeUploadQuota(error)
        if (notice) {
          for (const listener of noticeListeners) {
            listener(notice)
          }
        }
      }
      throw error
    })
    .finally(() => pending.delete(id))
  pending.set(id, { promise, controller })
  return promise
}

export const cancelUpload = (id: string) => {
  pending.get(id)?.controller.abort()
  setTask(id, null)
}

/** 各扩展名对应的 MIME：部分系统（如 Windows）给不出 file.type，按扩展名补齐 */
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

/** 取文件的 MIME：优先用浏览器给出的类型，缺失时按扩展名推断 */
export const resolveMimeType = (file: File) => file.type || MIME_BY_EXT[getFileExt(file.name)] || ''

export const isImage = (mimeType: string) => mimeType.startsWith('image/')

/** 文件扩展名（大写），用于卡片元信息 */
export const getExtension = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : ''
}

export const formatSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
