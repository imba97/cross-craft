import { expect, test, vi } from "vite-plus/test";
import { createLogger } from "../src/index.ts";

test("createLogger returns all expected methods", () => {
  const logger = createLogger("test");
  expect(typeof logger.info).toBe("function");
  expect(typeof logger.success).toBe("function");
  expect(typeof logger.warn).toBe("function");
  expect(typeof logger.error).toBe("function");
});

test("createLogger writes prefixed log message", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const logger = createLogger("transport");
  logger.info("connected", { port: 8080 });

  expect(infoSpy).toHaveBeenCalledWith('[crosscraft:transport] connected {"port":8080}');
});

test("createLogger serializes errors", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const logger = createLogger("bridge");
  logger.error(new Error("boom"));

  const firstCall = errorSpy.mock.calls[0]?.[0];
  expect(typeof firstCall).toBe("string");
  expect(firstCall).toContain("[crosscraft:bridge]");
  expect(firstCall).toContain("Error: boom");
});
