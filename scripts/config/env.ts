type EnvSource = NodeJS.ProcessEnv;

type ParseOptions = {
  env?: EnvSource;
  namespace?: string;
};

function resolveEnv(options?: ParseOptions): EnvSource {
  return options?.env ?? process.env;
}

function withNamespace(key: string, namespace?: string): string {
  return namespace ? `${namespace}.${key}` : key;
}

function readOptionalTrimmed(env: EnvSource, key: string): string | undefined {
  const raw = env[key];
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readOptionalString(key: string, options?: ParseOptions): string | undefined {
  const env = resolveEnv(options);
  return readOptionalTrimmed(env, key);
}

export function readBooleanWithDefault(
  key: string,
  fallback: boolean,
  options?: ParseOptions,
): boolean {
  const env = resolveEnv(options);
  const value = readOptionalTrimmed(env, key);
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }

  throw new Error(
    `Invalid env "${withNamespace(key, options?.namespace)}": expected boolean-like value.`,
  );
}

export function readEnumValue<const TValue extends string>(
  key: string,
  allowedValues: readonly TValue[],
  options?: ParseOptions,
): TValue | undefined {
  const env = resolveEnv(options);
  const value = readOptionalTrimmed(env, key);
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if ((allowedValues as readonly string[]).includes(normalized)) {
    return normalized as TValue;
  }

  throw new Error(
    `Invalid env "${withNamespace(
      key,
      options?.namespace,
    )}": "${value}". Expected one of: ${allowedValues.join(", ")}.`,
  );
}

export function readOptionalUrl(key: string, options?: ParseOptions): string | undefined {
  const env = resolveEnv(options);
  const value = readOptionalTrimmed(env, key);
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      `Invalid env "${withNamespace(key, options?.namespace)}": expected a valid http(s) URL.`,
    );
  }
}

export function readOptionalPort(key: string, options?: ParseOptions): string | undefined {
  const env = resolveEnv(options);
  const value = readOptionalTrimmed(env, key);
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(
      `Invalid env "${withNamespace(key, options?.namespace)}": expected numeric port.`,
    );
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid env "${withNamespace(key, options?.namespace)}": port out of range 1-65535.`,
    );
  }
  return String(port);
}
