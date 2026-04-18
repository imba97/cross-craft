# cross-craft

> ⚒️ 跨端工程 starter（Web + Capacitor + Electron），基于 Vite+ monorepo 的开箱即用脚手架。

[English README](./README.en.md)

## ✨ 特性

- ⚡️ **Vite+ Monorepo** — 统一管理 Web / Electron / Mobile 与共享包
- 📱 **一套代码，多端构建** — 支持 Web / Desktop / Mobile 应用打包
- 🔋 **TypeScript First** — 桥接协议、方法入参与返回值全链路类型约束
- 🔐 **Electron 安全基线** — `contextIsolation` + `sandbox` + preload 受控暴露
- 🌉 **Capacitor ↔ Electron Bridge** — 内置基础通信能力（runtime / external / file）
- 🧭 **版本化桥接协议** — 协议版本与 IPC channel 统一版本化管理
- 🧪 **内置校验与测试** — 请求校验、错误码体系与核心单测预置
- 🔄 **开发态热更新** — 渲染进程与主进程支持联动热更新与自动重启
- ⚙️ **统一应用配置** — `app.config.ts` + `sync:app-config` 跨端配置同步

## 🧱 预配置模块

- 🎨 **前端层**：Vue 3、Vue Router、UnoCSS、Sass
- 🖥 **桌面层**：Electron + electron-builder + 开发流程集成
- 📱 **移动层**：Capacitor（Android/iOS/Web）同步流程
- 🔌 **共享能力层**：
  - `@cross-craft/capacitor-electron`

## 🖼️ 截图预览

<details>
<summary>Electron（Windows）</summary>

![Electron (Windows)](./.github/screenshots/windows.png)

</details>

<details>
<summary>Web（Browser）</summary>

![Web (Browser)](./.github/screenshots/browser.png)

</details>

<details>
<summary>Android</summary>

![Android](./.github/screenshots/android.png)

</details>

## 🚀 现在开始

> Node.js 版本要求：`>= 22.12.0`

```bash
vp install
```

```bash
vp run ready
```

## ⚙️ 统一应用配置

统一配置文件：`app.config.ts`

目前支持统一同步：

- `appName`（Web 标题 / Electron `productName` / Android / iOS 显示名）
- `appVersion`（根与工作区包版本 / Android `versionName` / iOS `MARKETING_VERSION`）
- `appBuildNumber`（Android `versionCode` / iOS `CURRENT_PROJECT_VERSION`）
- `apiVersion`（`@cross-craft/capacitor-electron` 协议版本与 channel major）

修改配置后执行：

```bash
vp run sync:app-config
```

## 🧪 常用命令

### 根目录

```bash
# 开发
vp run dev
vp run dev:electron
vp run dev:android
vp run dev:ios

# 质量保障
vp run test
vp run lint
vp run check

# 构建
vp run build
vp run sync:app-config
```

### 移动端

```bash
vp run cap
vp run mobile#sync
vp run mobile#sync:android
vp run mobile#sync:ios
```

## 🗂 项目结构

```txt
cross-craft/
  apps/
    frontend/                        # Web app (Vue + Vite)
    electron/                        # Desktop host (Electron)
    mobile/                          # Capacitor shells (Android/iOS)
  packages/
    capacitor-electron/              # Capacitor <-> Electron 桥接实现
    utils/                           # 通用工具函数
    vite-plugin-cross-craft-electron/# Electron 开发流程集成
  scripts/                           # 根级跨包脚本
```

## 🧭 适用场景

- 🏁 从 0 到 1 搭建跨端项目基础设施
- 🔄 将既有 Web 项目扩展到桌面与移动端
- 🏢 团队沉淀内部跨端模板与工程规范

## 📋 初始化清单

- [ ] 修改应用名、包名、`appId`（如 `com.yourteam.app`）
- [ ] 替换 `apps/frontend` 页面内容为业务初始页
- [ ] 更新 `apps/electron` 打包信息（`productName`、图标、发布配置）
- [ ] 校准 `apps/mobile` 原生工程信息（Bundle/Application ID、启动图等）
- [ ] 按团队规范补充 CI、提交规范和发布流程
