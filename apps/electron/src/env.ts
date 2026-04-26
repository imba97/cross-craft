export type ElectronRuntimeEnv = {
  devServerUrl?: string;
};

function readOptionalUrl(key: string): string | undefined {
  const raw = process.env[key];
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid env "${key}": expected a valid http(s) URL.`);
  }
}

export function readElectronRuntimeEnv(): ElectronRuntimeEnv {
  return {
    devServerUrl: readOptionalUrl("VITE_DEV_SERVER_URL"),
  };
}
