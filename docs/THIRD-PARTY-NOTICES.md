# Third-Party Notices / 第三方许可证声明

> 适用产物：chat-demo Android 移植工程（本仓库）· 生成日期：2026-11-16

## 1. 本项目与许可声明

本 Android 移植工程基于 **DeepSeek 开源的 chat-demo v0.1.1**（MIT License, Copyright (c) 2026 DeepSeek）构建。

- 上游项目：<https://github.com/deepseek-ai/chat-demo>
- 上游发布物：`chat-demo-v0.1.1.zip`（Release v0.1.1）
- 上游许可证：MIT License，Copyright (c) 2026 DeepSeek；完整条文见 `android/app/src/main/assets/LICENSE`（与上游 LICENSE 逐字节一致，SHA256 `18895F3C654F34440E66B920A8815E43D38ABAA77BD54D8DA0E89C4F7FB987E4`）
- 本工程对上游代码的修改同样以 **MIT 许可证**发布。

MIT 许可证允许使用、复制、修改、合并、发布、再许可和销售，前提是保留上述版权声明与本许可声明（见本文档 §5.4 MIT 全文）。

## 2. 商标提示

「DeepSeek」名称、Logo 及相关标识归其权利人所有。**MIT 许可证仅授予著作权层面的许可，不授予任何商标许可。**

- 请勿在应用名称、应用图标、商店文案、启动页中使用 DeepSeek 官方商标或 Logo；
- 请勿暗示本应用由 DeepSeek 官方发布、维护或背书，除非已获得书面授权；
- 如确需提及来源，请使用客观描述性表述，例如"基于 DeepSeek 开源 chat-demo 构建"，且不得造成官方关联的混淆。

## 3. 生成说明与统计

- 数据来源：本项目 `package.json` 的依赖声明与 `pnpm-lock.yaml` 的解析结果，命令 `pnpm licenses list --prod --json`（仅统计生产依赖，不含 devDependencies）。
- 依赖规模：共 **209 个依赖条目**，覆盖 **218 个 name@version**（206 个唯一包名；同名多版本合并为一条列出）。
- 许可证来源：以各包 `package.json` 的 `license` 字段为准；字段缺失的包按发布包内的 LICENSE 文件人工核验（见 §6.1）。
- 许可证全文来源：Apache-2.0 取自 <https://www.apache.org/licenses/LICENSE-2.0.txt>；MIT/ISC/BSD-3-Clause/Unlicense 取自 SPDX License List Data。

| 许可证 | 依赖条目数 | 处理说明 |
| --- | ---: | --- |
| Apache-2.0 | 6 | 附 Apache-2.0 全文（§5.1）；发行包内无 NOTICE 文件 |
| MPL-2.0 OR Apache-2.0 | 1 | 双许可，本文件选择 Apache-2.0 履行义务（§6.2） |
| BSD-3-Clause | 6 | 附 BSD-3-Clause 全文（§5.2） |
| ISC | 33 | 附 ISC 全文（§5.3） |
| MIT | 162 | 附 MIT 全文（§5.4），含 khroma@2.1.0（核验为 MIT，§6.1） |
| Unlicense | 1 | 附 Unlicense 全文（§5.5） |
| **合计** | **209** | — |

## 4. 按许可证分组的依赖清单

每条格式为：`包名 版本 — 许可证 — 主页`。各第三方包的著作权归其各自作者所有，版权行以各包内 LICENSE 文件为准。

### 4.1 Apache-2.0（6 个条目）

- `@chevrotain/cst-dts-gen` 11.0.3 — Apache-2.0 — <https://github.com/Chevrotain/chevrotain#readme>
- `@chevrotain/gast` 11.0.3 — Apache-2.0 — <https://github.com/Chevrotain/chevrotain#readme>
- `@chevrotain/regexp-to-ast` 11.0.3 — Apache-2.0 — <https://github.com/Chevrotain/chevrotain#readme>
- `@chevrotain/types` 11.0.3 — Apache-2.0 — <https://chevrotain.io/documentation/>
- `@chevrotain/utils` 11.0.3 — Apache-2.0 — <https://github.com/Chevrotain/chevrotain#readme>
- `chevrotain` 11.0.3 — Apache-2.0 — <https://chevrotain.io/docs/>

### 4.2 MPL-2.0 OR Apache-2.0（按 Apache-2.0 处理，共 1 个条目）

- `dompurify` 3.4.17 — (MPL-2.0 OR Apache-2.0) — <https://github.com/cure53/DOMPurify>

### 4.3 BSD-3-Clause（6 个条目）

- `d3-array` 2.12.1 — BSD-3-Clause — <https://d3js.org/d3-array/>
- `d3-ease` 3.0.2 — BSD-3-Clause — <https://d3js.org/d3-ease/>
- `d3-path` 1.0.9 — BSD-3-Clause — <https://d3js.org/d3-path/>
- `d3-sankey` 0.12.3 — BSD-3-Clause — <https://github.com/d3/d3-sankey>
- `d3-shape` 1.3.7 — BSD-3-Clause — <https://d3js.org/d3-shape/>
- `rw` 1.3.3 — BSD-3-Clause — <https://github.com/mbostock/rw>

### 4.4 ISC（33 个条目）

- `d3` 7.9.2 — ISC — <https://d3js.org>
- `d3-array` 3.2.5 — ISC — <https://d3js.org/d3-array/>
- `d3-axis` 3.0.1 — ISC — <https://d3js.org/d3-axis/>
- `d3-brush` 3.0.1 — ISC — <https://d3js.org/d3-brush/>
- `d3-chord` 3.0.2 — ISC — <https://d3js.org/d3-chord/>
- `d3-color` 3.1.1 — ISC — <https://d3js.org/d3-color/>
- `d3-contour` 4.0.3 — ISC — <https://d3js.org/d3-contour/>
- `d3-delaunay` 6.0.6 — ISC — <https://github.com/d3/d3-delaunay>
- `d3-dispatch` 3.0.2 — ISC — <https://d3js.org/d3-dispatch/>
- `d3-drag` 3.0.1 — ISC — <https://d3js.org/d3-drag/>
- `d3-dsv` 3.0.2 — ISC — <https://d3js.org/d3-dsv/>
- `d3-fetch` 3.0.2 — ISC — <https://d3js.org/d3-fetch/>
- `d3-force` 3.0.1 — ISC — <https://d3js.org/d3-force/>
- `d3-format` 3.1.3 — ISC — <https://d3js.org/d3-format/>
- `d3-geo` 3.1.2 — ISC — <https://d3js.org/d3-geo/>
- `d3-hierarchy` 3.1.3 — ISC — <https://d3js.org/d3-hierarchy/>
- `d3-interpolate` 3.0.2 — ISC — <https://d3js.org/d3-interpolate/>
- `d3-path` 3.1.1 — ISC — <https://d3js.org/d3-path/>
- `d3-polygon` 3.0.2 — ISC — <https://d3js.org/d3-polygon/>
- `d3-quadtree` 3.0.2 — ISC — <https://d3js.org/d3-quadtree/>
- `d3-random` 3.0.2 — ISC — <https://d3js.org/d3-random/>
- `d3-scale` 4.0.3 — ISC — <https://d3js.org/d3-scale/>
- `d3-scale-chromatic` 3.1.1 — ISC — <https://d3js.org/d3-scale-chromatic/>
- `d3-selection` 3.0.1 — ISC — <https://d3js.org/d3-selection/>
- `d3-shape` 3.2.1 — ISC — <https://d3js.org/d3-shape/>
- `d3-time` 3.1.1 — ISC — <https://d3js.org/d3-time/>
- `d3-time-format` 4.1.1 — ISC — <https://d3js.org/d3-time-format/>
- `d3-timer` 3.0.2 — ISC — <https://d3js.org/d3-timer/>
- `d3-transition` 3.0.2 — ISC — <https://d3js.org/d3-transition/>
- `d3-zoom` 3.0.1 — ISC — <https://d3js.org/d3-zoom/>
- `delaunator` 5.1.0 — ISC — <https://github.com/mapbox/delaunator#readme>
- `idb` 8.0.3 — ISC — <https://github.com/jakearchibald/idb#readme>
- `internmap` 1.0.1, 2.0.3 — ISC — <https://github.com/mbostock/internmap/>

### 4.5 MIT（162 个条目）

- `@antfu/install-pkg` 1.1.0 — MIT — <https://github.com/antfu/install-pkg#readme>
- `@antfu/utils` 8.1.1 — MIT — <https://github.com/antfu/utils#readme>
- `@braintree/sanitize-url` 7.1.2 — MIT — <https://github.com/braintree/sanitize-url#readme>
- `@iconify/types` 2.0.0 — MIT — <https://github.com/iconify/iconify>
- `@iconify/utils` 2.3.0 — MIT — <https://iconify.design/docs/libraries/utils/>
- `@mermaid-js/parser` 0.6.3 — MIT — <https://github.com/mermaid-js/mermaid/tree/develop/packages/mermaid/parser/#readme>
- `@types/d3` 7.4.3 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3>
- `@types/d3-array` 3.2.2 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-array>
- `@types/d3-axis` 3.0.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-axis>
- `@types/d3-brush` 3.0.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-brush>
- `@types/d3-chord` 3.0.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-chord>
- `@types/d3-color` 3.1.3 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-color>
- `@types/d3-contour` 3.0.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-contour>
- `@types/d3-delaunay` 6.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-delaunay>
- `@types/d3-dispatch` 3.0.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-dispatch>
- `@types/d3-drag` 3.0.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-drag>
- `@types/d3-dsv` 3.0.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-dsv>
- `@types/d3-ease` 3.0.2 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-ease>
- `@types/d3-fetch` 3.0.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-fetch>
- `@types/d3-force` 3.0.10 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-force>
- `@types/d3-format` 3.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-format>
- `@types/d3-geo` 3.1.1 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-geo>
- `@types/d3-hierarchy` 3.1.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-hierarchy>
- `@types/d3-interpolate` 3.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-interpolate>
- `@types/d3-path` 3.1.1 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-path>
- `@types/d3-polygon` 3.0.2 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-polygon>
- `@types/d3-quadtree` 3.0.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-quadtree>
- `@types/d3-random` 3.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-random>
- `@types/d3-scale` 4.0.9 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-scale>
- `@types/d3-scale-chromatic` 3.1.0 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-scale-chromatic>
- `@types/d3-selection` 3.0.12 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-selection>
- `@types/d3-shape` 3.2.0 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-shape>
- `@types/d3-time` 3.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-time>
- `@types/d3-time-format` 4.0.3 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-time-format>
- `@types/d3-timer` 3.0.2 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-timer>
- `@types/d3-transition` 3.0.9 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-transition>
- `@types/d3-zoom` 3.0.9 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3-zoom>
- `@types/debug` 4.1.13 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/debug>
- `@types/geojson` 7946.0.16 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/geojson>
- `@types/hast` 3.0.5 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/hast>
- `@types/katex` 0.16.8 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/katex>
- `@types/mdast` 4.0.4 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/mdast>
- `@types/ms` 2.1.0 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/ms>
- `@types/prismjs` 1.26.6 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/prismjs>
- `@types/prop-types` 15.7.15 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/prop-types>
- `@types/react` 18.3.31 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react>
- `@types/react-dom` 18.3.0 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom>
- `@types/trusted-types` 2.0.7 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/trusted-types>
- `@types/unist` 3.0.3 — MIT — <https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/unist>
- `acorn` 8.19.0 — MIT — <https://github.com/acornjs/acorn>
- `ccount` 2.0.1 — MIT — <https://github.com/wooorm/ccount#readme>
- `character-entities` 2.0.2 — MIT — <https://github.com/wooorm/character-entities#readme>
- `chevrotain-allstar` 0.3.1 — MIT — <https://github.com/langium/chevrotain-allstar#readme>
- `clsx` 2.1.1 — MIT — <https://github.com/lukeed/clsx#readme>
- `commander` 7.2.0, 8.3.0 — MIT — <https://github.com/tj/commander.js#readme>
- `confbox` 0.1.8, 0.3.2 — MIT — <https://github.com/unjs/confbox#readme>
- `cose-base` 1.0.3, 2.2.0 — MIT — <https://github.com/iVis-at-Bilkent/cose-base#readme>
- `csstype` 3.2.3 — MIT — <https://github.com/frenic/csstype#readme>
- `cytoscape` 3.34.4 — MIT — <http://js.cytoscape.org>
- `cytoscape-cose-bilkent` 4.1.0 — MIT — <https://github.com/cytoscape/cytoscape.js-cose-bilkent>
- `cytoscape-fcose` 2.2.0 — MIT — <https://github.com/iVis-at-Bilkent/cytoscape.js-fcose>
- `dagre-d3-es` 7.0.11 — MIT — <https://github.com/tbo47/dagre-es#readme>
- `dayjs` 1.11.23 — MIT — <https://day.js.org>
- `debug` 4.4.3 — MIT — <https://github.com/debug-js/debug#readme>
- `decode-named-character-reference` 1.3.0 — MIT — <https://github.com/wooorm/decode-named-character-reference#readme>
- `dequal` 2.0.3 — MIT — <https://github.com/lukeed/dequal#readme>
- `devlop` 1.1.0 — MIT — <https://github.com/wooorm/devlop#readme>
- `escape-string-regexp` 5.0.0 — MIT — <https://github.com/sindresorhus/escape-string-regexp#readme>
- `exsolve` 1.2.0 — MIT — <https://github.com/unjs/exsolve#readme>
- `fflate` 0.8.3 — MIT — <https://101arrowz.github.io/fflate>
- `globals` 15.15.0 — MIT — <https://github.com/sindresorhus/globals#readme>
- `hachure-fill` 0.5.2 — MIT — <https://github.com/pshihn/hachure-fill#readme>
- `iconv-lite` 0.6.3 — MIT — <https://github.com/ashtuchkin/iconv-lite>
- `js-tokens` 3.0.0 — MIT — <https://github.com/lydell/js-tokens#readme>
- `katex` 0.16.22, 0.16.47 — MIT — <https://katex.org>
- `khroma` 2.1.0 — MIT — <https://github.com/fabiospampinato/khroma#readme>
- `kolorist` 1.8.0 — MIT — <https://github.com/marvinhagemeister/kolorist#readme>
- `langium` 3.3.1 — MIT — <https://langium.org>
- `layout-base` 1.0.2, 2.0.1 — MIT — <https://github.com/iVis-at-Bilkent/layout-base#readme>
- `local-pkg` 1.2.1 — MIT — <https://github.com/antfu-collective/local-pkg#readme>
- `lodash-es` 4.17.21, 4.18.1 — MIT — <https://lodash.com/custom-builds>
- `longest-streak` 3.1.0 — MIT — <https://github.com/wooorm/longest-streak#readme>
- `loose-envify` 1.4.0 — MIT — <https://github.com/zertosh/loose-envify>
- `markdown-table` 3.1.0 — MIT — <https://github.com/wooorm/markdown-table#readme>
- `marked` 16.4.2 — MIT — <https://marked.js.org>
- `mdast-util-find-and-replace` 3.0.2, 3.0.4 — MIT — <https://github.com/syntax-tree/mdast-util-find-and-replace#readme>
- `mdast-util-from-markdown` 2.0.3 — MIT — <https://github.com/syntax-tree/mdast-util-from-markdown#readme>
- `mdast-util-gfm` 3.1.0 — MIT — <https://github.com/syntax-tree/mdast-util-gfm#readme>
- `mdast-util-gfm-autolink-literal` 2.0.0 — MIT — <https://github.com/syntax-tree/mdast-util-gfm-autolink-literal#readme>
- `mdast-util-gfm-footnote` 2.1.0 — MIT — <https://github.com/syntax-tree/mdast-util-gfm-footnote#readme>
- `mdast-util-gfm-strikethrough` 2.0.1 — MIT — <https://github.com/syntax-tree/mdast-util-gfm-strikethrough#readme>
- `mdast-util-gfm-table` 2.0.1 — MIT — <https://github.com/syntax-tree/mdast-util-gfm-table#readme>
- `mdast-util-gfm-task-list-item` 2.0.1 — MIT — <https://github.com/syntax-tree/mdast-util-gfm-task-list-item#readme>
- `mdast-util-math` 3.0.0 — MIT — <https://github.com/syntax-tree/mdast-util-math#readme>
- `mdast-util-phrasing` 4.1.0 — MIT — <https://github.com/syntax-tree/mdast-util-phrasing#readme>
- `mdast-util-to-markdown` 2.2.3 — MIT — <https://github.com/syntax-tree/mdast-util-to-markdown#readme>
- `mdast-util-to-string` 4.0.0 — MIT — <https://github.com/syntax-tree/mdast-util-to-string#readme>
- `mermaid` 11.10.1 — MIT — <https://github.com/mermaid-js/mermaid#readme>
- `micromark` 4.0.3 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-core-commonmark` 2.0.3 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-extension-gfm` 3.0.0 — MIT — <https://github.com/micromark/micromark-extension-gfm#readme>
- `micromark-extension-gfm-autolink-literal` 2.1.0 — MIT — <https://github.com/micromark/micromark-extension-gfm-autolink-literal#readme>
- `micromark-extension-gfm-footnote` 2.1.0 — MIT — <https://github.com/micromark/micromark-extension-gfm-footnote#readme>
- `micromark-extension-gfm-strikethrough` 2.1.0 — MIT — <https://github.com/micromark/micromark-extension-gfm-strikethrough#readme>
- `micromark-extension-gfm-table` 2.1.1 — MIT — <https://github.com/micromark/micromark-extension-gfm-table#readme>
- `micromark-extension-gfm-tagfilter` 2.0.0 — MIT — <https://github.com/micromark/micromark-extension-gfm-tagfilter#readme>
- `micromark-extension-gfm-task-list-item` 2.1.0 — MIT — <https://github.com/micromark/micromark-extension-gfm-task-list-item#readme>
- `micromark-extension-llm-math` 3.1.0 — MIT — <https://github.com/ofk/micromark-extension-llm-math#readme>
- `micromark-factory-destination` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-factory-label` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-factory-space` 2.1.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-factory-title` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-factory-whitespace` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-character` 2.1.1 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-chunked` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-classify-character` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-combine-extensions` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-decode-numeric-character-reference` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-decode-string` 2.0.1 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-edit-map` 1.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-encode` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-html-tag-name` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-normalize-identifier` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-resolve-all` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-sanitize-uri` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-subtokenize` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-symbol` 2.0.0 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `micromark-util-types` 2.0.3 — MIT — <https://github.com/micromark/micromark/tree/main#readme>
- `mlly` 1.8.2 — MIT — <https://github.com/unjs/mlly#readme>
- `ms` 2.1.3 — MIT — <https://github.com/vercel/ms#readme>
- `package-manager-detector` 1.9.0 — MIT — <https://github.com/antfu-collective/package-manager-detector#readme>
- `path-data-parser` 0.1.0 — MIT — <https://github.com/pshihn/path-data-parser#readme>
- `pathe` 2.0.3 — MIT — <https://github.com/unjs/pathe#readme>
- `pkg-types` 1.3.1, 2.4.0 — MIT — <https://github.com/unjs/pkg-types#readme>
- `points-on-curve` 0.2.0 — MIT — <https://github.com/pshihn/bezier-points#readme>
- `points-on-path` 0.2.1 — MIT — <https://github.com/pshihn/points-on-path#readme>
- `prismjs` 1.30.0 — MIT — <https://github.com/PrismJS/prism#readme>
- `quansync` 0.2.11 — MIT — <https://github.com/quansync-dev/quansync#readme>
- `react` 18.3.1 — MIT — <https://reactjs.org/>
- `react-dom` 18.3.1 — MIT — <https://reactjs.org/>
- `roughjs` 4.6.6 — MIT — <https://roughjs.com>
- `safer-buffer` 2.1.2 — MIT — <https://github.com/ChALkeR/safer-buffer#readme>
- `scheduler` 0.23.2 — MIT — <https://reactjs.org/>
- `stylis` 4.4.0 — MIT — <https://github.com/thysultan/stylis.js>
- `tinyexec` 1.3.1 — MIT — <https://github.com/tinylibs/tinyexec#readme>
- `ts-dedent` 2.3.0 — MIT — <https://github.com/tamino-martinius/node-ts-dedent#readme>
- `ufo` 1.6.4 — MIT — <https://github.com/unjs/ufo#readme>
- `unist-util-is` 6.0.1 — MIT — <https://github.com/syntax-tree/unist-util-is#readme>
- `unist-util-remove-position` 5.0.0 — MIT — <https://github.com/syntax-tree/unist-util-remove-position#readme>
- `unist-util-stringify-position` 4.0.0 — MIT — <https://github.com/syntax-tree/unist-util-stringify-position#readme>
- `unist-util-visit` 5.2.0 — MIT — <https://github.com/syntax-tree/unist-util-visit#readme>
- `unist-util-visit-parents` 6.1.0 — MIT — <https://github.com/syntax-tree/unist-util-visit-parents#readme>
- `use-sync-external-store` 1.2.0 — MIT — <https://github.com/facebook/react#readme>
- `uuid` 11.1.1 — MIT — <https://github.com/uuidjs/uuid#readme>
- `vscode-jsonrpc` 8.2.0 — MIT — <https://github.com/Microsoft/vscode-languageserver-node#readme>
- `vscode-languageserver` 9.0.1 — MIT — <https://github.com/Microsoft/vscode-languageserver-node#readme>
- `vscode-languageserver-protocol` 3.17.5 — MIT — <https://github.com/Microsoft/vscode-languageserver-node#readme>
- `vscode-languageserver-textdocument` 1.0.16 — MIT — <https://github.com/microsoft/vscode-languageserver-node/tree/main/textDocument>
- `vscode-languageserver-types` 3.17.5 — MIT — <https://github.com/Microsoft/vscode-languageserver-node#readme>
- `vscode-uri` 3.0.8 — MIT — <https://github.com/microsoft/vscode-uri#readme>
- `zustand` 4.4.7 — MIT — <https://github.com/pmndrs/zustand>
- `zwitch` 2.0.4 — MIT — <https://github.com/wooorm/zwitch#readme>

### 4.6 Unlicense（1 个条目）

- `robust-predicates` 3.0.3 — Unlicense — <https://github.com/mourner/robust-predicates#readme>

## 5. 许可证全文

### 5.1 Apache-2.0

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### 5.2 BSD-3-Clause

```text
Copyright (c) <year> <owner>.

Redistribution and use in source and binary forms, with or without modification, are permitted
provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of
conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of
conditions and the following disclaimer in the documentation and/or other materials provided
with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to
endorse or promote products derived from this software without specific prior written
permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

### 5.3 ISC

```text
ISC License

Copyright <year> <owner>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without
fee is hereby granted, provided that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
OF THIS SOFTWARE.
```

### 5.4 MIT

```text
MIT License

Copyright (c) <year> <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 5.5 Unlicense

```text
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either
in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and
by any means.

In jurisdictions that recognize copyright laws, the author or authors of this software dedicate
any and all copyright interest in the software to the public domain. We make this dedication for
the benefit of the public at large and to the detriment of our heirs and successors. We intend
this dedication to be an overt act of relinquishment in perpetuity of all present and future
rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```

## 6. 说明

### 6.1 许可证字段缺失包的核验（khroma@2.1.0）

`pnpm licenses list --prod` 报告 `khroma@2.1.0` 的许可证为 `Unknown`。原因：npm registry 元数据与该包内 `package.json` 均未声明 `license` 字段。

核验结果：**该包实际为 MIT 许可证**，依据：

1. npm 发布 tarball（`khroma-2.1.0.tgz`）内的 `package/license` 文件为 MIT License，Copyright (c) 2019-present Fabio Spampinato, Andrew Maney；
2. GitHub 仓库（https://github.com/fabiospampinato/khroma/blob/master/license）的 license 文件与该 tarball 内的 license 文件**逐字节一致**（SHA256 `66B333B0F66759A0B710459E03F7029ABE17F4358114A128D2C972E642961B49`）。

因此本文档将 khroma@2.1.0 归入 MIT 分组，清单中**不存在"许可证未知"的依赖**。

### 6.2 MPL-2.0 OR Apache-2.0（dompurify@3.4.17）

`dompurify@3.4.17` 为 MPL-2.0 与 Apache-2.0 双许可。本文件选择按 **Apache-2.0** 履行义务（附 Apache-2.0 全文，§5.1），因此不适用 MPL-2.0 的源文件公开要求。该包发行包内同时包含 Apache-2.0（11,358 字节，SHA256 与 §5.1 全文一致）与 MPL-2.0 两份许可证文本，未包含 NOTICE 文件。

### 6.3 Apache-2.0 的 NOTICE 义务

本文档列出的 6 个 Apache-2.0 包（chevrotain 及 @chevrotain/* 子包）在发行包内**均未提供 NOTICE 文件**，其 LICENSE.txt 与 §5.1 全文逐字节一致（SHA256 `CFC7749B96F63BD31C3C42B5C471BF756814053E847C10F3EB003417BC523D30`），因此仅需附许可证全文，无需额外复制 NOTICE。

### 6.4 关于 @types/* 依赖

清单中包含 `@types/katex`、`@types/mdast`、`@types/prismjs`、`@types/react`、`@types/react-dom`、`@types/node` 等类型声明包：它们仅提供 TypeScript 类型声明，不含运行时代码，不会被打包进 JS bundle/APK 产物，列出以保持与 lockfile 的完整对应。

### 6.5 与纯文本版的关系

随 APK 分发的纯文本版位于 `android/app/src/main/assets/THIRD-PARTY-NOTICES.txt`，与本文件事实内容一致（包清单、许可证分组、全文与说明均相同，仅排版格式不同）。

---

本文件由审计流程根据上述数据自动生成（2026-11-16），如依赖发生变化请重新生成并核对。
