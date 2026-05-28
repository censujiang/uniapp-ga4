import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import uni from "@dcloudio/vite-plugin-uni";

// Vite config for the local playground.
// 本地 playground 的 Vite 配置。
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      "ga4-uniapp": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
});
