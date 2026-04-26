import UnoCSS from "@unocss/vite";
import Vue from "@vitejs/plugin-vue";
import { execSync } from "node:child_process";
import { fileURLToPath, resolve } from "url";
import { defineConfig, type PluginOption } from "vite-plus";
import VueRouter from "vue-router/vite";
import { loadAppConfig } from "../../scripts/config/app-config.ts";

const r = (p: string) => resolve(fileURLToPath(import.meta.url), p);
const { appName, appVersion, apiVersion } = loadAppConfig(import.meta.url);

function getGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  plugins: [
    VueRouter({ dts: r(".auto-generated/typed-router.d.ts") }) as unknown as PluginOption,
    Vue() as unknown as PluginOption,
    UnoCSS() as unknown as PluginOption,
  ],
  define: {
    __APP_NAME__: JSON.stringify(appName),
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_API_VERSION__: JSON.stringify(apiVersion),
    __APP_GIT_SHA__: JSON.stringify(getGitSha()),
  },
});
