import { BridgeError, toBridgeError } from "../../shared/errors/bridge-error";
import { BRIDGE_ERROR_CODES } from "../../shared/errors/codes";
import { BRIDGE_SUPPORTED_PROTOCOL_VERSIONS } from "../../shared/protocol/constants";
import type { BridgeResponse } from "../../shared/protocol/types";
import {
  isBridgeRequest,
  isSupportedMethod,
  isSupportedProtocolVersion,
} from "../../shared/schema/validators";
import { noopBridgeLogger, type BridgeLogger } from "../../shared/observability/logger";
import type { BridgeHandlerMap } from "./handlers";

export type MainDispatcherOptions = {
  defaultTimeoutMs?: number;
  logger?: BridgeLogger;
};

function createErrorResponse(
  requestId: string,
  traceId: string,
  error: BridgeError,
): BridgeResponse {
  return {
    ok: false,
    requestId,
    traceId,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new BridgeError(BRIDGE_ERROR_CODES.timeout, "Bridge request timed out.", {
          retryable: true,
        }),
      );
    }, timeoutMs);

    task.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function resolveTimeoutMs(rawTimeout: unknown, fallbackTimeoutMs: number): number {
  if (rawTimeout === undefined) {
    return fallbackTimeoutMs;
  }
  if (typeof rawTimeout !== "number" || !Number.isFinite(rawTimeout)) {
    throw new BridgeError(
      BRIDGE_ERROR_CODES.invalidParams,
      "meta.timeoutMs must be a finite number.",
    );
  }
  if (rawTimeout <= 0) {
    throw new BridgeError(
      BRIDGE_ERROR_CODES.invalidParams,
      "meta.timeoutMs must be greater than 0.",
    );
  }
  return Math.floor(rawTimeout);
}

export function createMainDispatcher(
  handlerMap: BridgeHandlerMap,
  options: MainDispatcherOptions = {},
) {
  const logger = options.logger ?? noopBridgeLogger;
  const defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;

  return async function dispatch(rawRequest: unknown): Promise<BridgeResponse> {
    const requestId = isBridgeRequest(rawRequest) ? rawRequest.requestId : "unknown-request";
    const traceId = isBridgeRequest(rawRequest)
      ? (rawRequest.meta?.traceId ?? rawRequest.requestId)
      : "unknown-trace";
    const startAt = Date.now();

    try {
      if (!isBridgeRequest(rawRequest)) {
        throw new BridgeError(BRIDGE_ERROR_CODES.invalidParams, "Invalid bridge request shape.");
      }

      if (!isSupportedProtocolVersion(rawRequest.protocolVersion)) {
        throw new BridgeError(
          BRIDGE_ERROR_CODES.unsupportedOperation,
          "Unsupported protocol version.",
          {
            supportedVersions: [...BRIDGE_SUPPORTED_PROTOCOL_VERSIONS],
          },
        );
      }

      if (!isSupportedMethod(rawRequest.method)) {
        throw new BridgeError(
          BRIDGE_ERROR_CODES.unsupportedOperation,
          `Unsupported method: ${rawRequest.method}.`,
        );
      }

      const method = rawRequest.method as keyof BridgeHandlerMap;
      const handler = handlerMap[method];
      const timeoutMs = resolveTimeoutMs(rawRequest.meta?.timeoutMs, defaultTimeoutMs);
      const data = await withTimeout(
        Promise.resolve(handler(rawRequest as never)) as Promise<unknown>,
        timeoutMs,
      );

      const response: BridgeResponse = {
        ok: true,
        requestId: rawRequest.requestId,
        traceId,
        data,
      };
      logger.log({
        requestId: rawRequest.requestId,
        traceId,
        method: rawRequest.method,
        durationMs: Date.now() - startAt,
        status: "ok",
      });

      return response;
    } catch (error) {
      const bridgeError = toBridgeError(error);
      logger.log({
        requestId,
        traceId,
        method: isBridgeRequest(rawRequest) ? rawRequest.method : "unknown",
        durationMs: Date.now() - startAt,
        status: "error",
        errorCode: bridgeError.code,
      });

      return createErrorResponse(requestId, traceId, bridgeError);
    }
  };
}
