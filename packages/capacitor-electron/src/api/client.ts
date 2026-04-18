import { BridgeError } from "../shared/errors/bridge-error";
import { BRIDGE_ERROR_CODES } from "../shared/errors/codes";
import type {
  MethodPayloadMap,
  MethodResultMap,
  OpenExternalOptions,
  ReadFileOptions,
  ReadFileResult,
  RuntimeInfo,
} from "../shared/protocol/types";
import { API_METHODS } from "./methods";

export type BridgeInvoke = <TMethod extends keyof MethodPayloadMap>(
  method: TMethod,
  payload: MethodPayloadMap[TMethod],
  options?: { timeoutMs?: number; signal?: AbortSignal },
) => Promise<MethodResultMap[TMethod]>;

export interface ElectronBridgeClient {
  getRuntimeInfo(options?: { timeoutMs?: number; signal?: AbortSignal }): Promise<RuntimeInfo>;
  openExternal(
    options: OpenExternalOptions,
    invokeOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<{
    success: true;
  }>;
  readFile(
    options: ReadFileOptions,
    invokeOptions?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<ReadFileResult>;
}

function ensureObject(value: unknown, errorMessage: string): void {
  if (typeof value !== "object" || value === null) {
    throw new BridgeError(BRIDGE_ERROR_CODES.invalidParams, errorMessage);
  }
}

export function createElectronBridgeClient(invoke: BridgeInvoke): ElectronBridgeClient {
  return {
    async getRuntimeInfo(options = {}): Promise<RuntimeInfo> {
      return invoke(API_METHODS.getRuntimeInfo, {}, options);
    },
    async openExternal(
      options: OpenExternalOptions,
      invokeOptions: { timeoutMs?: number; signal?: AbortSignal } = {},
    ): Promise<{ success: true }> {
      ensureObject(options, "openExternal options must be an object.");
      return invoke(API_METHODS.openExternal, options, invokeOptions);
    },
    async readFile(
      options: ReadFileOptions,
      invokeOptions: { timeoutMs?: number; signal?: AbortSignal } = {},
    ): Promise<ReadFileResult> {
      ensureObject(options, "readFile options must be an object.");
      return invoke(API_METHODS.readFile, options, invokeOptions);
    },
  };
}

type GlobalBridgeTarget = {
  __crossCraftCapElectron?: { invoke?: BridgeInvoke };
};

export function createElectronBridgeClientFromGlobal(
  target: GlobalBridgeTarget = globalThis as unknown as GlobalBridgeTarget,
): ElectronBridgeClient {
  const invoke = target.__crossCraftCapElectron?.invoke;

  if (!invoke) {
    throw new BridgeError(
      BRIDGE_ERROR_CODES.internalError,
      "Preload bridge is not available on global target.",
    );
  }

  return createElectronBridgeClient(invoke);
}
