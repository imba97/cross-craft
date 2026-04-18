import { contextBridge, ipcRenderer } from "electron";
import { createPreloadInvoker, type IpcInvoke } from "@cross-craft/capacitor-electron";

const ipcInvoke: IpcInvoke = async (channel, request) => ipcRenderer.invoke(channel, request);
const invoke = createPreloadInvoker(ipcInvoke);

console.log("[electron-preload] exposing __crossCraftCapElectron");
contextBridge.exposeInMainWorld("__crossCraftCapElectron", { invoke });
