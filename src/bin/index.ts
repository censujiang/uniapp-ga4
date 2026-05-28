#!/usr/bin/env node
import { name as packageName, version as packageVersion } from "../../package.json" with { type: "json" }
import { startMcpServer } from "./mcp"

type CliArgs = {
  command: string
  docs?: string
  help: boolean
  version: boolean
}

const usage = `
${packageName} ${packageVersion}

Usage:
  ga4-uniapp mcp [--docs ./docs/public/json/ga4-uniapp.api.json]
  ga4-uniapp --help
  ga4-uniapp --version

Commands:
  mcp        Start the ga4-uniapp documentation MCP server.
             启动 ga4-uniapp 文档 MCP 服务器。

Options:
  --docs     Path to the API Extractor JSON document.
             API Extractor JSON 文档路径。
`

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help || !args.command) {
    process.stdout.write(usage.trimStart())
    return
  }
  if (args.version || args.command === "version") {
    process.stdout.write(`${packageVersion}\n`)
    return
  }
  if (args.command === "mcp") {
    await startMcpServer({
      docsPath: args.docs,
    })
    return
  }

  process.stderr.write(`Unknown command: ${args.command}\n\n${usage}`)
  process.exitCode = 1
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: "",
    help: false,
    version: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--help" || value === "-h") {
      args.help = true
    } else if (value === "--version" || value === "-v") {
      args.version = true
    } else if (value === "--docs") {
      args.docs = argv[index + 1]
      index += 1
    } else if (value.startsWith("--docs=")) {
      args.docs = value.slice("--docs=".length)
    } else if (!args.command) {
      args.command = value
    }
  }

  return args
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
