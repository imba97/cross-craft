import { createLogger } from "../logger";

const loggerBundle = {
  appLifecycleLogger: createLogger("app-lifecycle"),
  bridgeHealthLogger: createLogger("bridge-health"),
};

export function useLogger() {
  return loggerBundle;
}
