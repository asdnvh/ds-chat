import { unzipSync } from 'fflate'

/** 文件预览：docx/xlsx/pptx 在 WebView 内渲染；pdf 交给原生 PdfRenderer；其余交给系统应用打开。 */

const native = () => (window as unknown as { DSChatNative?: Record<string, unknown> }).DSChatNative

let overlay: HTMLElement | null = null
let restoreClose: (() => void) | null = null

const closePreview = () => {
  if (!overlay) {
    return
  }
  overlay.remove()
  overlay = null
  try {
    ;(native()?.setOverlayOpen as ((open: boolean) => void) | undefined)?.(false)
  } catch {
    // 忽略
  }
  if (restoreClose) {
    ;(window as unknown as Record<string, unknown>).__dsChatCloseOverlay = restoreClose
    restoreClose = null
  }
}

/** mammoth 输出的 HTML 里去掉脚本与事件属性，避免渲染不可信文档时执行代码 */
const sanitize = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')

const showOverlay = (title: string, body: HTMLElement) => {
  closePreview()
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-ds-file-preview', '1')
  wrapper.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;background:#111;display:flex;flex-direction:column;color:#eee;font-family:system-ui,sans-serif'
  const header = document.createElement('div')
  header.style.cssText =
    'display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12);flex:0 0 auto'
  const name = document.createElement('div')
  name.textContent = title
  name.style.cssText = 'flex:1;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = '关闭'
  close.style.cssText =
    'background:#333;color:#fff;border:0;border-radius:8px;padding:8px 16px;font-size:14px'
  close.addEventListener('click', closePreview)
  header.append(name, close)
  const content = document.createElement('div')
  content.style.cssText = 'flex:1;overflow:auto;padding:16px 18px 40px;line-height:1.7;font-size:15px'
  content.appendChild(body)
  wrapper.append(header, content)
  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) {
      closePreview()
    }
  })
  document.body.appendChild(wrapper)
  overlay = wrapper
  try {
    ;(native()?.setOverlayOpen as ((open: boolean) => void) | undefined)?.(true)
  } catch {
    // 忽略
  }
  const previous = (window as unknown as Record<string, unknown>).__dsChatCloseOverlay
  if (typeof previous === 'function') {
    restoreClose = previous as () => void
  }
  ;(window as unknown as Record<string, unknown>).__dsChatCloseOverlay = closePreview
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const renderDocx = async (buffer: ArrayBuffer): Promise<HTMLElement> => {
  // @ts-ignore 浏览器专用构建，避免打包 Node 版依赖
  const mammoth = await import('mammoth/mammoth.browser.min.js')
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  const body = document.createElement('div')
  body.style.cssText = 'max-width:820px;margin:0 auto'
  body.innerHTML = sanitize(String(result.value))
  body.querySelectorAll('img').forEach((img) => {
    img.style.maxWidth = '100%'
  })
  body.querySelectorAll('table').forEach((table) => {
    table.style.cssText = 'border-collapse:collapse;width:100%;margin:12px 0'
    table.querySelectorAll('td,th').forEach((cell) => {
      ;(cell as HTMLElement).style.cssText = 'border:1px solid #555;padding:6px 10px'
    })
  })
  return body
}

const renderXlsx = async (buffer: ArrayBuffer): Promise<HTMLElement> => {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const body = document.createElement('div')
  for (const sheetName of workbook.SheetNames) {
    const title = document.createElement('div')
    title.textContent = sheetName
    title.style.cssText = 'font-size:15px;font-weight:600;margin:18px 0 8px'
    body.appendChild(title)
    const html = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName], { header: '', footer: '' })
    const wrap = document.createElement('div')
    wrap.style.cssText = 'overflow:auto'
    wrap.innerHTML = sanitize(html)
    body.appendChild(wrap)
  }
  return body
}

const renderPptx = (buffer: ArrayBuffer): HTMLElement => {
  const entries = unzipSync(new Uint8Array(buffer))
  const slideNames = Object.keys(entries)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(/(\d+)/.exec(a)?.[1] ?? 0) - Number(/(\d+)/.exec(b)?.[1] ?? 0))
  const body = document.createElement('div')
  body.style.cssText = 'max-width:820px;margin:0 auto'
  const note = document.createElement('div')
  note.textContent = '仅显示文字大纲（PPT 版式与图片不在客户端渲染）'
  note.style.cssText = 'color:#aaa;font-size:13px;margin-bottom:14px'
  body.appendChild(note)
  slideNames.forEach((name, index) => {
    const xml = new TextDecoder('utf-8').decode(entries[name])
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) =>
      match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .trim()
    )
    const card = document.createElement('div')
    card.style.cssText = 'border:1px solid #3a3a3a;border-radius:10px;padding:12px 16px;margin-bottom:12px'
    const heading = document.createElement('div')
    heading.textContent = `第 ${index + 1} 页`
    heading.style.cssText = 'color:#8ab4ff;font-size:13px;margin-bottom:6px'
    const list = document.createElement('div')
    list.textContent = texts.filter(Boolean).join('\n')
    list.style.cssText = 'white-space:pre-wrap;font-size:14px'
    card.append(heading, list)
    body.appendChild(card)
  })
  return body
}

/** 消息里的文件：按扩展名选择预览方式 */
export const openMessageFile = async (url: string, name: string, mimeType: string) => {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  try {
    if (ext === 'pdf') {
      const blob = await (await fetch(url)).blob()
      const base64 = await blobToBase64(blob)
      const wrapper = (window as unknown as { __dsChatOpenPdf?: (data: string, name: string) => boolean })
        .__dsChatOpenPdf
      if (wrapper && wrapper(base64, name)) {
        return
      }
      const openPdf = native()?.openPdf as ((data: string, name: string) => void) | undefined
      if (openPdf) {
        openPdf(base64, name)
        return
      }
    }
    if (ext === 'docx' || ext === 'xlsx' || ext === 'xls' || ext === 'pptx') {
      const buffer = await (await fetch(url)).arrayBuffer()
      if (ext === 'docx') {
        showOverlay(name, await renderDocx(buffer))
      } else if (ext === 'pptx') {
        showOverlay(name, renderPptx(buffer))
      } else {
        showOverlay(name, await renderXlsx(buffer))
      }
      return
    }
    // 其余格式：交给系统里能打开它的应用
    const blob = await (await fetch(url)).blob()
    const base64 = await blobToBase64(blob)
    const openFile = native()?.openFile as
      | ((data: string, mime: string, name: string) => void)
      | undefined
    if (openFile) {
      openFile(base64, blob.type || mimeType || 'application/octet-stream', name)
      return
    }
  } catch (error) {
    console.warn('[dschat-preview] 预览失败', error instanceof Error ? error.message : String(error))
  }
  ;(window as unknown as Record<string, unknown>).__dsChatDownloadName = name
  window.open(url, '_blank', 'noreferrer')
}

/** 保存文件到系统下载目录（走原生桥接，文件名保持原名） */
export const saveMessageFile = async (url: string, name: string, mimeType: string) => {
  try {
    const blob = await (await fetch(url)).blob()
    const base64 = await blobToBase64(blob)
    const save = native()?.saveDownload as
      | ((data: string, mime: string, name: string) => void)
      | undefined
    if (save) {
      save(base64, blob.type || mimeType || 'application/octet-stream', name)
    }
  } catch (error) {
    console.warn('[dschat-preview] 保存失败', error instanceof Error ? error.message : String(error))
  }
}

/** 长按文件卡片：底部弹出「保存」「转发」两个选项 */
export const showFileMenu = (url: string, name: string, mimeType: string) => {
  const sheet = document.createElement('div')
  sheet.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.45);display:flex;align-items:flex-end'
  const panel = document.createElement('div')
  panel.style.cssText =
    'width:100%;background:#1c1c1e;border-radius:16px 16px 0 0;padding:12px 16px 26px;color:#fff;font-family:system-ui,sans-serif'
  const title = document.createElement('div')
  title.textContent = name
  title.style.cssText = 'font-size:13px;color:#aaa;padding:8px 4px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
  const makeButton = (label: string) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.style.cssText =
      'display:block;width:100%;padding:15px;margin-top:10px;background:#2c2c2e;border:0;border-radius:10px;color:#fff;font-size:16px'
    return button
  }
  const save = makeButton('保存到本地')
  save.addEventListener('click', () => {
    sheet.remove()
    void saveMessageFile(url, name, mimeType)
  })
  const share = makeButton('转发到其他应用')
  share.addEventListener('click', () => {
    sheet.remove()
    ;(window as unknown as { __dsChatShareFile?: (url: string, name: string) => void })
      .__dsChatShareFile?.(url, name)
  })
  const cancel = makeButton('取消')
  cancel.addEventListener('click', () => sheet.remove())
  panel.append(title, save, share, cancel)
  sheet.appendChild(panel)
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) {
      sheet.remove()
    }
  })
  document.body.appendChild(sheet)
}