import { describe, expect, test } from "vite-plus/test";
import { applyReplacementRules, replaceOrThrow, withJsonTrailingNewline } from "../src/text.ts";

describe("text helpers", () => {
  test("replaceOrThrow replaces matched content", () => {
    const result = replaceOrThrow("version=0.1.0", /0\.1\.0/, "0.2.0", "version");
    expect(result).toBe("version=0.2.0");
  });

  test("replaceOrThrow throws when pattern is missing", () => {
    expect(() => replaceOrThrow("name=CrossCraft", /missing/, "x", "missing")).toThrow(
      /failed to update missing: pattern not found/,
    );
  });

  test("applyReplacementRules applies rules sequentially", () => {
    const result = applyReplacementRules('appName: "A"\nversion: "1.0.0"', [
      {
        pattern: /appName:\s*"[^"]*"/,
        replacement: 'appName: "CrossCraft"',
        label: "appName",
      },
      {
        pattern: /version:\s*"[^"]*"/,
        replacement: 'version: "1.2.3"',
        label: "version",
      },
    ]);

    expect(result).toBe('appName: "CrossCraft"\nversion: "1.2.3"');
  });

  test("withJsonTrailingNewline keeps stable pretty output", () => {
    const result = withJsonTrailingNewline({ name: "CrossCraft", version: "0.1.0" });
    expect(result).toBe('{\n  "name": "CrossCraft",\n  "version": "0.1.0"\n}\n');
  });
});
