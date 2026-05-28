import { defineBuildConfig } from "unbuild"

const banner = `/*!
 * ga4-uniapp
 * Copyright (c) 2026 censujiang
 * Released under the MIT License.
 */\n`

const uniConditionalCommentMarker = "__GA4_UNIAPP_CONDITIONAL_COMMENT__"

type RollupPluginLike = {
  name: string
  transform?: (code: string, id: string) => { code: string; map: null } | null
  renderChunk?: (code: string) => { code: string; map: null } | null
}

function preserveUniConditionalComments(): RollupPluginLike {
  return {
    name: "preserve-uni-conditional-comments",
    transform(code, id) {
      if (!/\.[cm]?[jt]sx?$/.test(id) || !code.includes("// #")) {
        return null
      }
      return {
        code: code.replace(
          /^([ \t]*)\/\/[ \t]*#(ifdef|ifndef|endif)([^\r\n]*)/gm,
          (_match, indent: string, directive: string, condition: string) =>
            `${indent}/*! ${uniConditionalCommentMarker} #${directive}${condition} */`,
        ),
        map: null,
      }
    },
    renderChunk(code) {
      if (!code.includes(uniConditionalCommentMarker)) {
        return null
      }
      return {
        code: code.replace(
          /\/\*!\s*__GA4_UNIAPP_CONDITIONAL_COMMENT__\s+#(ifdef|ifndef|endif)(.*?)\s*\*\//g,
          (_match, directive: string, condition: string) => `// #${directive}${condition}`,
        ),
        map: null,
      }
    },
  }
}

export default defineBuildConfig([
  {
    entries: ["src/index"],
    declaration: true,
    clean: true,
    rollup: {
      emitCJS: true,
      output: {
        banner,
      },
      esbuild: {
        legalComments: "inline",
      },
    },
    hooks: {
      "rollup:options"(_ctx, options) {
        options.plugins.unshift(preserveUniConditionalComments())
      },
    },
    failOnWarn: false,
  },
  {
    entries: [
      {
        input: "src/bin/index",
        name: "ga4-uniapp",
      },
    ],
    clean: true,
    outDir: "bin",
    rollup: {
      esbuild: {
        minify: true,
        legalComments: "inline",
      },
    },
    failOnWarn: false,
  },
])
