import { zipSync, strToU8 } from 'fflate'

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

type Slide = { title: string; bullets: string[] }

const parseSlides = (markdown: string): Slide[] => {
  const chunks = markdown.replace(/\r\n?/g, '\n').split(/\n-{3,}\n/)
  const slides: Slide[] = []
  for (const chunk of chunks) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      continue
    }
    let title = ''
    const bullets: string[] = []
    for (const line of lines) {
      const heading = /^#{1,6}\s+(.*)$/.exec(line)
      if (heading && !title) {
        title = heading[1]
        continue
      }
      const bullet = /^[-*+]\s+(.*)$/.exec(line) ?? /^(\d+)[.)]\s+(.*)$/.exec(line)
      if (bullet) {
        bullets.push(bullet[bullet.length - 1])
      } else if (!title) {
        title = line
      } else {
        bullets.push(line)
      }
    }
    slides.push({ title: title || `第 ${slides.length + 1} 页`, bullets })
  }
  return slides.length > 0 ? slides : [{ title: '未命名演示', bullets: [] }]
}

const NS_P =
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'

const textRuns = (text: string, size: number, bold = false) =>
  `<a:p><a:r><a:rPr lang="zh-CN" sz="${size}"${bold ? ' b="1"' : ''}/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`

const bulletRuns = (text: string) =>
  `<a:p><a:pPr marL="342900" indent="-342900"><a:buChar char="•"/></a:pPr>` +
  `<a:r><a:rPr lang="zh-CN" sz="2000"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`

const slideXml = (slide: Slide) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<p:sld ${NS_P}><p:cSld><p:spTree>` +
  `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>` +
  `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>` +
  `<p:spPr><a:xfrm><a:off x="838200" y="365125"/><a:ext cx="10515600" cy="1325563"/></a:xfrm></p:spPr>` +
  `<p:txBody><a:bodyPr/><a:lstStyle/>${textRuns(slide.title, 4000, true)}</p:txBody></p:sp>` +
  `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>` +
  `<p:spPr><a:xfrm><a:off x="838200" y="1825625"/><a:ext cx="10515600" cy="4351338"/></a:xfrm></p:spPr>` +
  `<p:txBody><a:bodyPr/><a:lstStyle/>${slide.bullets.map(bulletRuns).join('')}</p:txBody></p:sp>` +
  `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`

const slideLayout =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<p:sldLayout ${NS_P} type="titleAndContent"><p:cSld name="Title and Content"><p:spTree>` +
  `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>` +
  `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`

const slideMaster =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<p:sldMaster ${NS_P}><p:cSld><p:spTree>` +
  `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>` +
  `</p:spTree></p:cSld>` +
  `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>` +
  `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>` +
  `<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`

const theme =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="DS Chat">` +
  `<a:themeElements><a:clrScheme name="DS Chat"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>` +
  `<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F1F1F"/></a:dk2>` +
  `<a:lt2><a:srgbClr val="F2F2F2"/></a:lt2><a:accent1><a:srgbClr val="4D6BFE"/></a:accent1>` +
  `<a:accent2><a:srgbClr val="FF6B6B"/></a:accent2><a:accent3><a:srgbClr val="FFC145"/></a:accent3>` +
  `<a:accent4><a:srgbClr val="4CAF50"/></a:accent4><a:accent5><a:srgbClr val="2AA8F2"/></a:accent5>` +
  `<a:accent6><a:srgbClr val="9C27B0"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink>` +
  `<a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>` +
  `<a:fontScheme name="DS Chat"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Noto Sans SC"/><a:cs typeface=""/></a:majorFont>` +
  `<a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Noto Sans SC"/><a:cs typeface=""/></a:minorFont></a:fontScheme>` +
  `<a:fmtScheme name="DS Chat"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>` +
  `<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>` +
  `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>` +
  `<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>` +
  `</a:themeElements></a:theme>`

/** 生成最小可用的 PPTX（标题 + 项目符号正文），内容为 Markdown 风格 */
export const buildPptx = (markdown: string): File => {
  const slides = parseSlides(markdown)
  const files: Record<string, Uint8Array> = {}
  const contentTypes: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
  ]
  slides.forEach((_, index) => {
    contentTypes.push(
      `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
  })
  contentTypes.push('</Types>')

  const presentationRels = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
  ]
  slides.forEach((_, index) => {
    presentationRels.push(
      `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`
    )
  })
  presentationRels.push('</Relationships>')

  const presentation =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<p:presentation ${NS_P}>` +
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
    '<p:sldIdLst>' +
    slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join('') +
    '</p:sldIdLst>' +
    '<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>' +
    '</p:presentation>'

  files['[Content_Types].xml'] = strToU8(contentTypes.join(''))
  files['_rels/.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>' +
      '</Relationships>'
  )
  files['ppt/presentation.xml'] = strToU8(presentation)
  files['ppt/_rels/presentation.xml.rels'] = strToU8(presentationRels.join(''))
  files['ppt/slideMasters/slideMaster1.xml'] = strToU8(slideMaster)
  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>' +
      '</Relationships>'
  )
  files['ppt/slideLayouts/slideLayout1.xml'] = strToU8(slideLayout)
  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>' +
      '</Relationships>'
  )
  files['ppt/theme/theme1.xml'] = strToU8(theme)
  slides.forEach((slide, index) => {
    files[`ppt/slides/slide${index + 1}.xml`] = strToU8(slideXml(slide))
    files[`ppt/slides/_rels/slide${index + 1}.xml.rels`] = strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
        '</Relationships>'
    )
  })
  const bytes = zipSync(files, { level: 6 })
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new File([copy], 'presentation.pptx', {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
}
