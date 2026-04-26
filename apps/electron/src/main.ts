import { join, resolve } from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { setupBridgeMainRuntime } from "@cross-craft/capacitor-electron";
import { useLogger } from "@cross-craft/utils";
import { readElectronRuntimeEnv } from "./env";

const { appLifecycleLogger, bridgeHealthLogger } = useLogger();

function createMainWindow(): BrowserWindow {
  const startupBeginAt = Date.now();
  const runtimeEnv = readElectronRuntimeEnv();
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(resolve(__dirname), "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devServerUrl = runtimeEnv.devServerUrl;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(join(app.getAppPath(), "www", "index.html"));
  }

  mainWindow.webContents.on("preload-error", (_event, preloadPath, error) => {
    bridgeHealthLogger.error("preload-error:", preloadPath, error);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    void mainWindow.webContents
      .executeJavaScript(
        "Boolean(window.__crossCraftCapElectron && window.__crossCraftCapElectron.invoke)",
      )
      .then((available) => {
        bridgeHealthLogger.info("bridge available:", available);
        appLifecycleLogger.info("renderer load completed in", `${Date.now() - startupBeginAt}ms`);
      })
      .catch((error) => {
        bridgeHealthLogger.error("bridge probe failed:", error);
      });
  });

  mainWindow.once("ready-to-show", () => {
    appLifecycleLogger.success("window ready-to-show in", `${Date.now() - startupBeginAt}ms`);
    if (!mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on("console-message", (_event, level, message) => {
    appLifecycleLogger.info(`renderer:${String(level)}`, message);
  });

  return mainWindow;
}

function registerCapacitorElectronBridge(): void {
  bridgeHealthLogger.info("register capacitor-electron bridge");
  setupBridgeMainRuntime(ipcMain, {
    shellAdapter: {
      async openExternal(url: string): Promise<void> {
        await shell.openExternal(url);
      },
    },
    allowedFileRoots: [app.getAppPath()],
    capacitorVersion: "8.x",
    electronVersion: process.versions.electron,
  });
}

void app.whenReady().then(() => {
  appLifecycleLogger.info("app ready");
  registerCapacitorElectronBridge();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      appLifecycleLogger.info("activate with empty windows, creating one");
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  appLifecycleLogger.warn("window-all-closed");
  if (process.platform !== "darwin") {
    appLifecycleLogger.info("quitting app on non-darwin platform");
    app.quit();
  }
});
