# ga4-uniapp

GA4 direct-collect client for uni-app. It sends browser-style GA4 hits to the
Google Analytics collect endpoint with a measurement ID only; no Measurement
Protocol `api_secret` is required or sent.

uni-app GA4 直连统计客户端。SDK 使用类似 gtag.js 的 URL 参数格式向 Google
Analytics collect 端点发送事件，只需要 GA4 Measurement ID，不使用也不会发送
Measurement Protocol 的 `api_secret`。

## Install

```bash
bun add ga4-uniapp
```

安装：

```bash
bun add ga4-uniapp
```

## Usage

```ts
import { createUniAppGA4 } from "ga4-uniapp"

export const ga4 = createUniAppGA4({
  measurementId: "G-XXXXXXXXXX",
  appOrigin: "https://your-app.example",
  debug: import.meta.env.DEV,
})

// Sends the initial page_view and registers uni/H5 automatic collectors.
ga4.init()
await ga4.event("select_content", {
  content_type: "button",
  item_id: "hero-cta",
})
```

用法：

```ts
import { createUniAppGA4 } from "ga4-uniapp"

export const ga4 = createUniAppGA4({
  measurementId: "G-XXXXXXXXXX",
  appOrigin: "https://your-app.example",
  debug: import.meta.env.DEV,
})

// 发送初始 page_view，并注册 uni/H5 自动统计能力。
ga4.init()
await ga4.event("select_content", {
  content_type: "button",
  item_id: "hero-cta",
})
```

## Transport

The default endpoint is:

```text
https://www.google-analytics.com/g/collect
```

This is the GA4 web collect endpoint used by gtag-style browser hits. The SDK
does not call `https://www.google-analytics.com/mp/collect` and does not use an
API secret. Event parameters are encoded as query parameters such as `v=2`,
`tid`, `cid`, `sid`, `sct`, `en`, `dl`, `dt`, `_dbg`, and `ep.*`.

By default, transport goes through `uni.request`, and persistence goes through
`uni.getStorageSync`, `uni.setStorageSync`, and `uni.removeStorageSync`. The
SDK default path does not use browser-only `Image`, `fetch`, or `localStorage`
fallbacks.

默认端点是：

```text
https://www.google-analytics.com/g/collect
```

这是 GA4 Web 统计的 gtag 风格端点。SDK 不调用
`https://www.google-analytics.com/mp/collect`，也不使用 API secret。事件参数会被编码成
`v=2`、`tid`、`cid`、`sid`、`sct`、`en`、`dl`、`dt`、`_dbg`、`ep.*` 等查询参数。

默认传输使用 `uni.request`，默认持久化使用 `uni.getStorageSync`、
`uni.setStorageSync` 和 `uni.removeStorageSync`。SDK 默认路径不会走浏览器专属的
`Image`、`fetch` 或 `localStorage` 兜底。

## Automatic Collection

`ga4.init()` enables these collectors by default:

- initial `page_view`
- uni interceptors for `navigateTo`, `redirectTo`, `reLaunch`, `switchTab`, `navigateBack`, `downloadFile`, and `openDocument`
- H5 `history.pushState/replaceState/popstate` page views
- H5 outbound-link, file-download, form-start, form-submit, scroll, pagehide, and visibility flush listeners

The public event names and common event parameter keys are typed from
`@types/gtag.js`; direct-collect URL parameter mapping remains internal to this
SDK.

The SDK imports `core-js` URL and URLSearchParams polyfills at the package entry
so uni-app App runtimes without native `URL` objects can still use WHATWG-style
URL parsing. H5 builds keep using native implementations when they are already
valid.

In App runtimes that do not expose `location.href`, page locations are built
from the uni page route and `appOrigin`. If `appOrigin` is omitted, the fallback
origin is `https://uniapp.local`, so GA4 still receives a protocol-qualified
`page_location` such as `https://uniapp.local/pages/index/index`.

`ga4.init()` 默认开启这些自动统计能力：

- 初始 `page_view`
- `navigateTo`、`redirectTo`、`reLaunch`、`switchTab`、`navigateBack`、`downloadFile`、`openDocument` 的 uni 拦截器
- H5 `history.pushState/replaceState/popstate` 页面浏览
- H5 外链点击、文件下载、表单开始、表单提交、滚动、pagehide、visibility flush 监听

公共事件名和常见事件参数 key 使用 `@types/gtag.js` 类型；direct collect 的 URL 参数映射仍由 SDK 内部维护。

SDK 在入口处导入 `core-js` 的 URL 和 URLSearchParams 垫片，因此没有原生
`URL` 对象的 uni-app App 运行时也会走 WHATWG 风格 URL 解析。H5 环境已有有效原生实现时会继续使用原生实现。

在没有 `location.href` 的 App 运行时，页面地址会由 uni 页面路由和 `appOrigin`
拼出。未配置 `appOrigin` 时兜底 origin 是 `https://uniapp.local`，因此 GA4 仍会收到带 protocol 的
`page_location`，例如 `https://uniapp.local/pages/index/index`。

## Playground

The `playground/` directory is created from the official uni-app Vue 3 + Vite TypeScript template. The official CLI docs recommend `dcloudio/uni-preset-vue#vite-ts` for this template family.

`playground/` 目录来自官方 uni-app Vue 3 + Vite TypeScript 模板。官方 CLI 文档推荐使用 `dcloudio/uni-preset-vue#vite-ts` 这一模板分支。

```bash
bun install
bun run playground:dev
```

For local GA4 DebugView testing, create `playground/.env.local`:

```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

## MCP Docs Server

Build the package and generate the API Extractor JSON first:

先构建包并生成 API Extractor JSON：

```bash
bun install
bun run docs
```

Start the docs MCP server:

启动文档 MCP 服务器：

```bash
ga4-uniapp mcp
```

Use a custom docs path:

使用自定义文档路径：

```bash
ga4-uniapp mcp --docs=./docs/public/json/ga4-uniapp.api.json
```

Available MCP tools:

可用 MCP 工具：

- `ga4_uniapp_search_docs`: search generated API docs by keyword.
- `ga4_uniapp_get_doc`: read one exact generated API doc entry.
- `ga4_uniapp_list_capabilities`: list exported runtime APIs and exported types from the main package entry.

The package intentionally exports only the main entry (`"."`). Type information is emitted through `dist/index.d.ts`, without a separate `./types` export path.

本包有意只导出主入口（`"."`）。类型信息通过 `dist/index.d.ts` 提供，不再单独提供 `./types` 导出路径。
