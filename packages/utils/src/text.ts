export type TextReplacementRule = {
  pattern: RegExp;
  replacement: string;
  label: string;
};

export function replaceOrThrow(
  content: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  if (!pattern.test(content)) {
    throw new Error(`failed to update ${label}: pattern not found`);
  }
  return content.replace(pattern, replacement);
}

export function applyReplacementRules(
  content: string,
  rules: readonly TextReplacementRule[],
): string {
  return rules.reduce(
    (nextContent, rule) => replaceOrThrow(nextContent, rule.pattern, rule.replacement, rule.label),
    content,
  );
}

export function withJsonTrailingNewline(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
