import { spawn } from "node:child_process"
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import zip from "bestzip"

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const sourcePackagePath = join(rootDir, "package.json")
const outDir = join(rootDir, "uni-module-dist")
const jsSdkDir = join(outDir, "js_sdk")
const pluginId = "censujiang-ga4"

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === "win32",
      stdio: "inherit",
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`))
    })
  })

const readText = async (path) => readFile(path, "utf8")

const readJson = async (path) => JSON.parse(await readText(path))

const writeJson = async (path, value) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

const buildPackageJson = (pkg) => ({
  id: pluginId,
  displayName: "Google Analytics 4 直连统计 SDK",
  version: pkg.version,
  description: "ga4-uniapp：面向 uni-app 的 Google Analytics 4 direct collect 事件统计客户端。",
  keywords: ["ga4-uniapp", "uni-app", "GA4", "Google Analytics", "analytics", "统计"],
  repository: "github:censujiang/ga4-uniapp",
  license: pkg.license,
  type: "module",
  main: "./index.js",
  module: "./index.js",
  types: "./index.d.ts",
  files: [
    "index.js",
    "index.d.ts",
    "js_sdk",
    "readme.md",
    "changelog.md",
    "license.md",
  ],
  dependencies: pkg.dependencies,
  engines: {
    HBuilderX: "^3.1.0",
    "uni-app": "^3.7.8",
  },
  dcloudext: {
    category: ["JS SDK", "通用 SDK"],
    type: "sdk-js",
    darkmode: "√",
    i18n: "√",
    widescreen: "√",
    contact: {
      qq: "",
    },
    declaration: {
      ads: "无",
      data: "插件仅在使用者主动初始化并配置 GA4 Measurement ID 后，通过 uni.request 向 https://www.google-analytics.com/g/collect 发送 GA4 事件数据。发送内容包括使用者传入的事件参数，以及 SDK 自动统计的页面地址、标题、会话、客户端标识等基础分析字段。插件不上传数据到作者自有服务器。",
      permissions: "网络",
    },
    npmurl: "https://www.npmjs.com/package/ga4-uniapp",
  },
  uni_modules: {
    dependencies: [],
    platforms: {
      cloud: {
        tcb: "x",
        aliyun: "x",
        alipay: "x",
      },
      client: {
        "uni-app": {
          vue: {
            vue2: "√",
            vue3: "√",
          },
          web: {
            safari: "√",
            chrome: "√",
          },
          app: {
            vue: "√",
            nvue: "√",
            android: "√",
            ios: "√",
            harmony: "√",
          },
          mp: {
            weixin: "√",
            alipay: "√",
            toutiao: "√",
            baidu: "√",
            kuaishou: "√",
            jd: "√",
            harmony: "√",
            qq: "√",
            lark: "√",
            xhs: "√",
          },
          quickapp: {
            huawei: "√",
            union: "√",
          },
        },
        "uni-app-x": {
          web: {
            safari: "-",
            chrome: "-",
          },
          app: {
            android: "-",
            ios: "-",
            harmony: "-",
          },
          mp: {
            weixin: "-",
          },
        },
      },
    },
    treeShaking: {
      app: {
        android: true,
        ios: true,
        harmony: false,
      },
      web: false,
    },
  },
})

const buildReadme = async () => {
  const readme = await readText(join(rootDir, "README.md"))
  return `# ga4-uniapp

Google Analytics 4 直连统计 SDK for uni-app。

这是 DCloud 插件市场版的 ${pluginId}。导入插件后可以从 uni_modules 路径使用：

\`\`\`ts
import { createUniAppGA4 } from "@/uni_modules/${pluginId}"
\`\`\`

如果当前工程没有解析插件根目录的 \`package.json\` 入口，也可以直接引入 JS SDK 文件：

\`\`\`ts
import { createUniAppGA4 } from "@/uni_modules/${pluginId}/js_sdk/${pluginId}.js"
\`\`\`

${readme}
`
}

const buildChangelog = (version) => `# Changelog

## ${version} - 2026-05-29

- 软件名称更新为 ga4-uniapp。
- 更新 DCloud 插件市场 uni_modules 发布包。
- 提供 uni-app GA4 direct collect 事件统计客户端、类型声明和使用文档。
`

await run("bun", ["run", "build"])

const pkg = await readJson(sourcePackagePath)
await rm(outDir, { recursive: true, force: true })
await mkdir(jsSdkDir, { recursive: true })

await writeJson(join(outDir, "package.json"), buildPackageJson(pkg))
await writeFile(join(outDir, "index.js"), `export * from "./js_sdk/${pluginId}.js"\n`)
await writeFile(join(outDir, "index.d.ts"), `export * from "./js_sdk/${pluginId}"\n`)
await copyFile(join(rootDir, "dist", "index.mjs"), join(jsSdkDir, `${pluginId}.js`))
await copyFile(join(rootDir, "dist", "index.d.ts"), join(jsSdkDir, `${pluginId}.d.ts`))
await copyFile(join(rootDir, "LICENSE"), join(outDir, "license.md"))
await writeFile(join(outDir, "readme.md"), await buildReadme())
await writeFile(join(outDir, "changelog.md"), buildChangelog(pkg.version))
await writeFile(join(outDir, ".npmignore"), [".hbuilderx", "unpackage", "node_modules", "package-lock.json", "bun.lock", ""].join("\n"))

const zipFile = `${pluginId}.zip`
await zip({
  source: [
    "package.json",
    "index.js",
    "index.d.ts",
    "js_sdk",
    "readme.md",
    "changelog.md",
    "license.md",
    ".npmignore",
  ],
  destination: zipFile,
  cwd: outDir,
})

console.log(`Created ${join(outDir, zipFile)}`)
