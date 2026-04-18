import { describe, expect, test } from "vite-plus/test";
import {
  type BridgeInvoke,
  createElectronBridgeClient,
  createElectronBridgeClientFromGlobal,
} from "../../src/api/client";
import { BRIDGE_ERROR_CODES } from "../../src/shared/errors/codes";
import { BRIDGE_METHODS, BRIDGE_PROTOCOL_VERSION } from "../../src/shared/protocol/constants";
import type { MethodResultMap } from "../../src/shared/protocol/types";

describe("api/client", () => {
  test("calls runtime.getInfo through invoke", async () => {
    const invoke: BridgeInvoke = async (method) => {
      expect(method).toBe(BRIDGE_METHODS.runtimeGetInfo);
      return {
        protocolVersion: BRIDGE_PROTOCOL_VERSION,
        supportedProtocolVersions: [BRIDGE_PROTOCOL_VERSION],
        capacitorVersion: "8.0.0",
        electronVersion: "34.0.0",
        nodeVersion: process.versions.node,
        platform: process.platform,
        capabilities: ["runtime.getInfo"],
      } as MethodResultMap[typeof method];
    };
    const client = createElectronBridgeClient(invoke);

    const runtimeInfo = await client.getRuntimeInfo();
    expect(runtimeInfo.protocolVersion).toBe(BRIDGE_PROTOCOL_VERSION);
  });

  test("validates openExternal input", async () => {
    const invoke: BridgeInvoke = async () => {
      throw new Error("invoke should not be called for invalid params");
    };
    const client = createElectronBridgeClient(invoke);
    await expect(client.openExternal(null as never)).rejects.toMatchObject({
      code: BRIDGE_ERROR_CODES.invalidParams,
    });
  });

  test("opens external url through invoke", async () => {
    const invoke: BridgeInvoke = async (method, payload) => {
      expect(method).toBe(BRIDGE_METHODS.externalOpen);
      expect(payload).toEqual({ url: "https://example.com" });
      return { success: true } as MethodResultMap[typeof method];
    };
    const client = createElectronBridgeClient(invoke);
    const result = await client.openExternal({ url: "https://example.com" });
    expect(result.success).toBe(true);
  });

  test("reads file through invoke", async () => {
    const invoke: BridgeInvoke = async (method, payload) => {
      expect(method).toBe(BRIDGE_METHODS.fileRead);
      expect(payload).toEqual({ path: "demo.txt", encoding: "utf-8" });
      return { content: "demo", encoding: "utf-8" } as MethodResultMap[typeof method];
    };
    const client = createElectronBridgeClient(invoke);
    const result = await client.readFile({ path: "demo.txt", encoding: "utf-8" });
    expect(result.content).toBe("demo");
  });

  test("throws when preload bridge is missing on global", async () => {
    expect(() => createElectronBridgeClientFromGlobal({})).toThrow(
      "Preload bridge is not available",
    );
  });
});
