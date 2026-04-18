import type {
  InvokeOptions,
  MethodPayloadMap,
  MethodResultMap,
} from "@cross-craft/capacitor-electron";

type ElectronBridgeGlobal = {
  __crossCraftCapElectron?: {
    invoke: <TMethod extends keyof MethodPayloadMap>(
      method: TMethod,
      payload: MethodPayloadMap[TMethod],
      options?: InvokeOptions,
    ) => Promise<MethodResultMap[TMethod]>;
  };
};

declare global {
  interface Window extends ElectronBridgeGlobal {}
}

export {};
