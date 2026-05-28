import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { name as  packageName, version as packageVersion } from "../../package.json" with { type: "json" }

const latestProtocolVersion = "2025-11-25"
const supportedProtocolVersions = new Set([
  latestProtocolVersion,
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
])

type ApiExcerptToken = {
  kind?: string
  text?: string
  canonicalReference?: string
}

type ApiItem = {
  kind?: string
  name?: string
  canonicalReference?: string
  docComment?: string
  excerptTokens?: ApiExcerptToken[]
  fileUrlPath?: string
  releaseTag?: string
  members?: ApiItem[]
}

type DocEntry = {
  id: string
  kind: string
  name: string
  displayName: string
  canonicalReference: string
  docComment: string
  signature: string
  fileUrlPath: string
  releaseTag: string
  path: string[]
  references: string[]
  members: string[]
  searchText: string
}

type DocsIndex = {
  docsPath: string
  entries: DocEntry[]
  byKey: Map<string, DocEntry>
}

type JsonRpcId = string | number | null

type JsonRpcRequest = {
  jsonrpc?: string
  id?: JsonRpcId
  method?: string
  params?: unknown
}

type ToolResult = {
  content: Array<{
    type: "text"
    text: string
  }>
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

type ToolDefinition = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: {
    readOnlyHint: boolean
    destructiveHint: boolean
    idempotentHint: boolean
    openWorldHint: boolean
  }
}

class JsonRpcError extends Error {
  code: number
  data?: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.code = code
    this.data = data
  }
}

const toolDefinitions: ToolDefinition[] = [
  {
    name: "ga4_uniapp_search_docs",
    title: "Search ga4-uniapp API Docs",
    description: "Search the generated API JSON by name, signature, documentation text, or canonical reference.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword, for example helloWorld or template.",
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          description: "Maximum result count. Defaults to 8.",
        },
        kind: {
          type: "string",
          description: "Optional API Extractor item kind filter, such as Function, TypeAlias, or Interface.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "ga4_uniapp_get_doc",
    title: "Get ga4-uniapp API Doc",
    description: "Return one exact API document entry by display name, simple name, canonical reference, or search result id.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Display name, simple name, canonical reference, or id, for example helloWorld.",
        },
      },
      required: ["identifier"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "ga4_uniapp_list_capabilities",
    title: "List ga4-uniapp Capabilities",
    description: "List exported runtime APIs and exported types from the main package entry.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "api", "types"],
          description: "Capability category. Defaults to all.",
        },
        includeDetails: {
          type: "boolean",
          description: "Whether to include signatures for every listed capability. Defaults to true.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
]

let cachedDocsIndex: DocsIndex | null = null
let cachedDocsError: Error | null = null

export async function startMcpServer(options: {
  docsPath?: string
} = {}) {
  const pendingRequests = new Set<Promise<void>>()

  return new Promise<void>((resolve) => {
    let buffer = ""

    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ""
      lines.forEach(handleLine)
    })
    process.stdin.on("end", () => {
      const line = buffer.trim()
      if (line) {
        handleLine(line)
      }
      Promise.all([...pendingRequests]).then(() => resolve())
    })
    process.stdin.resume()
  })

  function handleLine(line: string) {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }

    let request: JsonRpcRequest
    try {
      request = JSON.parse(trimmed) as JsonRpcRequest
    } catch (error) {
      sendError(null, new JsonRpcError(-32700, "Parse error", getErrorMessage(error)))
      return
    }

    const pendingRequest = handleRequest(request, options).then((result) => {
      if (result !== undefined && request.id !== undefined) {
        sendResult(request.id, result)
      }
    }).catch((error) => {
      if (request.id !== undefined) {
        sendError(request.id, normalizeJsonRpcError(error))
      } else {
        process.stderr.write(`${getErrorMessage(error)}\n`)
      }
    }).finally(() => {
      pendingRequests.delete(pendingRequest)
    })
    pendingRequests.add(pendingRequest)
  }
}

async function handleRequest(request: JsonRpcRequest, options: {
  docsPath?: string
}) {
  if (request.jsonrpc !== "2.0") {
    throw new JsonRpcError(-32600, "Invalid Request: jsonrpc must be 2.0")
  }

  switch (request.method) {
    case "initialize":
      return createInitializeResult(request.params)
    case "notifications/initialized":
    case "notifications/cancelled":
      return undefined
    case "ping":
      return {}
    case "tools/list":
      return {
        tools: toolDefinitions,
      }
    case "tools/call":
      return callTool(request.params, options)
    case "resources/list":
      return {
        resources: [],
      }
    case "prompts/list":
      return {
        prompts: [],
      }
    default:
      if (request.method?.startsWith("notifications/")) {
        return undefined
      }
      throw new JsonRpcError(-32601, `Method not found: ${request.method || ""}`)
  }
}

function createInitializeResult(params: unknown) {
  const requestParams = toRecord(params)
  const requestedVersion = typeof requestParams.protocolVersion === "string"
    ? requestParams.protocolVersion
    : latestProtocolVersion
  const protocolVersion = supportedProtocolVersions.has(requestedVersion)
    ? requestedVersion
    : latestProtocolVersion

  return {
    protocolVersion,
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo: {
      name: `${packageName}-docs`,
      version: packageVersion,
    },
    instructions: [
      "Use ga4_uniapp_search_docs to find matching ga4-uniapp API entries.",
      "Use ga4_uniapp_get_doc for exact signatures and documentation.",
      "Use ga4_uniapp_list_capabilities to discover exported runtime APIs and exported types.",
    ].join("\n"),
  }
}

function callTool(params: unknown, options: {
  docsPath?: string
}): ToolResult {
  const toolParams = toRecord(params)
  const name = typeof toolParams.name === "string" ? toolParams.name : ""
  const args = toRecord(toolParams.arguments)

  switch (name) {
    case "ga4_uniapp_search_docs":
      return searchDocs(args, options)
    case "ga4_uniapp_get_doc":
      return getDoc(args, options)
    case "ga4_uniapp_list_capabilities":
      return listCapabilities(args, options)
    default:
      throw new JsonRpcError(-32602, `Unknown tool: ${name}`)
  }
}

function searchDocs(args: Record<string, unknown>, options: {
  docsPath?: string
}): ToolResult {
  const index = getDocsIndex(options.docsPath)
  const query = typeof args.query === "string" ? args.query.trim() : ""
  const kind = typeof args.kind === "string" ? args.kind : ""
  const limit = clampNumber(typeof args.limit === "number" ? args.limit : 8, 1, 50)

  if (!query) {
    return createToolError("query is required.")
  }

  const results = index.entries
    .filter((entry) => !kind || entry.kind === kind)
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, query),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.displayName.localeCompare(b.entry.displayName))
    .slice(0, limit)
    .map((result) => result.entry)

  const text = [
    `Found ${results.length} ga4-uniapp API document result(s) for "${query}".`,
    `Source: ${index.docsPath}`,
    "",
    ...results.map(formatEntrySummary),
  ].join("\n")

  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
    structuredContent: {
      query,
      count: results.length,
      source: index.docsPath,
      results: results.map((entry) => toStructuredEntry(entry, false)),
    },
  }
}

function getDoc(args: Record<string, unknown>, options: {
  docsPath?: string
}): ToolResult {
  const index = getDocsIndex(options.docsPath)
  const identifier = typeof args.identifier === "string" ? args.identifier.trim() : ""

  if (!identifier) {
    return createToolError("identifier is required.")
  }

  const entry = findEntry(index, identifier)

  if (!entry) {
    return createToolError(`No ga4-uniapp API document entry matched "${identifier}". Use ga4_uniapp_search_docs first.`)
  }

  return {
    content: [
      {
        type: "text",
        text: formatEntryDetail(entry, index.docsPath),
      },
    ],
    structuredContent: {
      source: index.docsPath,
      result: toStructuredEntry(entry, true),
    },
  }
}

function listCapabilities(args: Record<string, unknown>, options: {
  docsPath?: string
}): ToolResult {
  const index = getDocsIndex(options.docsPath)
  const requestedCategory = typeof args.category === "string" ? args.category : "all"
  const category = ["all", "api", "types"].includes(requestedCategory) ? requestedCategory : "all"
  const includeDetails = typeof args.includeDetails === "boolean" ? args.includeDetails : true
  const apiEntries = index.entries.filter((entry) => ["Function", "Variable"].includes(entry.kind))
  const typeEntries = index.entries.filter((entry) => ["Interface", "TypeAlias"].includes(entry.kind))
  const sections: string[] = [
    `Source: ${index.docsPath}`,
  ]

  if (category === "all" || category === "api") {
    sections.push("", "Runtime API capabilities:", ...apiEntries.map((entry) => formatCapabilityLine(entry, includeDetails)))
  }
  if (category === "all" || category === "types") {
    sections.push("", "Exported types:", ...typeEntries.map((entry) => formatCapabilityLine(entry, includeDetails)))
  }

  return {
    content: [
      {
        type: "text",
        text: sections.join("\n"),
      },
    ],
    structuredContent: {
      source: index.docsPath,
      category,
      api: category === "all" || category === "api" ? apiEntries.map((entry) => toStructuredEntry(entry, includeDetails)) : [],
      types: category === "all" || category === "types" ? typeEntries.map((entry) => toStructuredEntry(entry, includeDetails)) : [],
    },
  }
}

function getDocsIndex(explicitPath?: string): DocsIndex {
  if (cachedDocsIndex) {
    return cachedDocsIndex
  }
  if (cachedDocsError) {
    throw cachedDocsError
  }

  try {
    const docsPath = resolveDocsPath(explicitPath)
    const apiModel = JSON.parse(readFileSync(docsPath, "utf8")) as ApiItem
    cachedDocsIndex = buildDocsIndex(apiModel, docsPath)
    return cachedDocsIndex
  } catch (error) {
    cachedDocsError = error instanceof Error ? error : new Error(String(error))
    throw cachedDocsError
  }
}

function resolveDocsPath(explicitPath?: string) {
  const binDir = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    explicitPath,
    process.env.GA4_UNIAPP_MCP_API_DOCS,
    path.resolve(process.cwd(), "docs/public/json/ga4-uniapp.api.json"),
    path.resolve(binDir, "../docs/public/json/ga4-uniapp.api.json"),
    path.resolve(binDir, "../../docs/public/json/ga4-uniapp.api.json"),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate)
    if (existsSync(resolved)) {
      return resolved
    }
  }

  throw new Error(`Unable to find ga4-uniapp API JSON. Checked: ${candidates.map((candidate) => path.resolve(candidate)).join(", ")}`)
}

function buildDocsIndex(apiModel: ApiItem, docsPath: string): DocsIndex {
  const entries: DocEntry[] = []

  walkApiItem(apiModel, [], (item, itemPath) => {
    const entry = createDocEntry(item, itemPath)
    if (entry) {
      entries.push(entry)
    }
  })

  const byKey = new Map<string, DocEntry>()
  entries.forEach((entry) => {
    [
      entry.id,
      entry.name,
      entry.displayName,
      entry.canonicalReference,
      entry.path.join("."),
    ].filter(Boolean).forEach((key) => {
      byKey.set(normalizeSearchText(key), entry)
    })
  })

  return {
    docsPath,
    entries,
    byKey,
  }
}

function walkApiItem(item: ApiItem, parentPath: string[], visitor: (item: ApiItem, itemPath: string[]) => void) {
  const itemName = typeof item.name === "string" && item.name ? item.name : undefined
  const itemPath = itemName ? [...parentPath, itemName] : parentPath
  visitor(item, itemPath)
  item.members?.forEach((member) => walkApiItem(member, itemPath, visitor))
}

function createDocEntry(item: ApiItem, itemPath: string[]): DocEntry | null {
  if (!item.kind) {
    return null
  }

  const kind = item.kind
  const name = item.name || item.canonicalReference || kind
  const displayName = createDisplayName(item, itemPath)
  const canonicalReference = item.canonicalReference || ""
  const docComment = cleanDocComment(item.docComment || "")
  const signature = createSignature(item.excerptTokens)
  const references = collectReferences(item)
  const members = item.members?.map((member) => createDisplayName(member, [...itemPath, member.name || ""]).trim()).filter(Boolean) || []
  const id = canonicalReference || displayName
  const searchText = normalizeSearchText([
    kind,
    name,
    displayName,
    canonicalReference,
    docComment,
    signature,
    references.join(" "),
    members.join(" "),
  ].join(" "))

  return {
    id,
    kind,
    name,
    displayName,
    canonicalReference,
    docComment,
    signature,
    fileUrlPath: item.fileUrlPath || "",
    releaseTag: item.releaseTag || "",
    path: itemPath,
    references,
    members,
    searchText,
  }
}

function createDisplayName(item: ApiItem, itemPath: string[]) {
  const name = item.name || ""
  const parentName = itemPath.length > 1 ? itemPath[itemPath.length - 2] : ""

  if (name && parentName && (item.kind === "PropertySignature" || item.kind === "TypeAlias")) {
    return `${parentName}.${name}`
  }
  if (name) {
    return name
  }

  return item.canonicalReference || item.kind || "unknown"
}

function cleanDocComment(raw: string) {
  return raw
    .replace(/^\s*\/\*\*?/, "")
    .replace(/\*\/\s*$/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
    .filter((line) => !/^@(public|beta|alpha|internal|deprecated)\b/.test(line.trim()))
    .join("\n")
    .trim()
}

function createSignature(tokens?: ApiExcerptToken[]) {
  return tokens?.map((token) => token.text || "").join("").trim() || ""
}

function collectReferences(item: ApiItem) {
  const references = new Set<string>()
  item.excerptTokens?.forEach((token) => {
    if (token.kind === "Reference") {
      if (token.text) {
        references.add(token.text)
      }
      if (token.canonicalReference) {
        references.add(token.canonicalReference)
      }
    }
  })

  const linkPattern = /\{@link\s+([^}\s]+)[^}]*}/g
  let match = linkPattern.exec(item.docComment || "")
  while (match) {
    references.add(match[1])
    match = linkPattern.exec(item.docComment || "")
  }

  return [...references]
}

function scoreEntry(entry: DocEntry, query: string) {
  const normalizedQuery = normalizeSearchText(query)
  const normalizedName = normalizeSearchText(entry.name)
  const normalizedDisplayName = normalizeSearchText(entry.displayName)
  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean)
  let score = 0

  if (normalizedName === normalizedQuery || normalizedDisplayName === normalizedQuery) {
    score += 100
  }
  if (normalizedDisplayName.includes(normalizedQuery)) {
    score += 60
  }
  if (entry.searchText.includes(normalizedQuery)) {
    score += 30
  }
  queryParts.forEach((part) => {
    if (normalizedName.includes(part)) {
      score += 20
    }
    if (normalizedDisplayName.includes(part)) {
      score += 10
    }
    if (entry.searchText.includes(part)) {
      score += 5
    }
  })

  return score
}

function findEntry(index: DocsIndex, identifier: string) {
  const exactMatch = index.byKey.get(normalizeSearchText(identifier))
  if (exactMatch) {
    return exactMatch
  }

  return index.entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, identifier),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.entry
}

function formatEntrySummary(entry: DocEntry) {
  const lines = [
    `- ${entry.displayName} [${entry.kind}]`,
    `  id: ${entry.id}`,
  ]

  if (entry.signature) {
    lines.push(`  signature: ${collapseWhitespace(entry.signature)}`)
  }

  const summary = collapseWhitespace(entry.docComment)
  if (summary) {
    lines.push(`  doc: ${truncateText(summary, 220)}`)
  }

  return lines.join("\n")
}

function formatEntryDetail(entry: DocEntry, docsPath: string) {
  const sections = [
    `Name: ${entry.displayName}`,
    `Kind: ${entry.kind}`,
    `ID: ${entry.id}`,
    `Source: ${docsPath}`,
  ]

  if (entry.canonicalReference) {
    sections.push(`Canonical reference: ${entry.canonicalReference}`)
  }
  if (entry.fileUrlPath) {
    sections.push(`Declared in: ${entry.fileUrlPath}`)
  }
  if (entry.releaseTag) {
    sections.push(`Release tag: ${entry.releaseTag}`)
  }
  if (entry.signature) {
    sections.push("", "Signature:", entry.signature)
  }
  if (entry.docComment) {
    sections.push("", "Documentation:", entry.docComment)
  }
  if (entry.references.length) {
    sections.push("", "References:", ...entry.references.map((reference) => `- ${reference}`))
  }
  if (entry.members.length) {
    sections.push("", "Members:", ...entry.members.map((member) => `- ${member}`))
  }

  return sections.join("\n")
}

function formatCapabilityLine(entry: DocEntry, includeDetails: boolean) {
  if (!includeDetails || !entry.signature) {
    return `- ${entry.displayName}`
  }
  return `- ${entry.displayName}: ${collapseWhitespace(entry.signature)}`
}

function toStructuredEntry(entry: DocEntry, includeDetails: boolean) {
  return {
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    displayName: entry.displayName,
    canonicalReference: entry.canonicalReference,
    fileUrlPath: entry.fileUrlPath,
    releaseTag: entry.releaseTag,
    signature: includeDetails ? entry.signature : undefined,
    documentation: includeDetails ? entry.docComment : truncateText(collapseWhitespace(entry.docComment), 220),
    references: entry.references,
    members: includeDetails ? entry.members : undefined,
  }
}

function createToolError(message: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, Math.max(0, maxLength - 1))}...`
}

function sendResult(id: JsonRpcId | undefined, result: unknown) {
  process.stdout.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id,
    result,
  })}\n`)
}

function sendError(id: JsonRpcId | undefined, error: JsonRpcError) {
  process.stdout.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: {
      code: error.code,
      message: error.message,
      data: error.data,
    },
  })}\n`)
}

function normalizeJsonRpcError(error: unknown) {
  if (error instanceof JsonRpcError) {
    return error
  }
  return new JsonRpcError(-32603, getErrorMessage(error))
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
