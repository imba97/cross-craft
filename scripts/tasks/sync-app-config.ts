import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveRepositoryRoot } from "../common/utils.ts";
import { loadAppConfig } from "../config/app-config.ts";
import {
  applyReplacementRules,
  replaceOrThrow,
  withJsonTrailingNewline,
} from "../../packages/utils/src/text.ts";

const rootDir = resolveRepositoryRoot(import.meta.url);
const WORKSPACE_PACKAGE_PATHS = [
  "package.json",
  "apps/frontend/package.json",
  "apps/mobile/package.json",
  "apps/electron/package.json",
  "packages/capacitor-electron/package.json",
  "packages/utils/package.json",
  "packages/vite-plugin-cross-craft-electron/package.json",
] as const;

async function updateFrontendTitle(appName: string): Promise<void> {
  const filePath = resolve(rootDir, "apps/frontend/index.html");
  const content = await readFile(filePath, "utf8");
  const next = replaceOrThrow(
    content,
    /<title>[\s\S]*?<\/title>/,
    `<title>${appName}</title>`,
    "frontend title",
  );
  await writeFile(filePath, next, "utf8");
}

async function updateElectronPackageProductName(
  appName: string,
  appVersion: string,
): Promise<void> {
  const filePath = resolve(rootDir, "apps/electron/package.json");
  const raw = await readFile(filePath, "utf8");
  const json = JSON.parse(raw) as {
    version?: string;
    build?: {
      productName?: string;
      artifactName?: string;
    };
  };
  json.version = appVersion;
  json.build = json.build ?? {};
  json.build.productName = appName;
  json.build.artifactName = "${productName}-${version}-${os}-${arch}.${ext}";
  await writeFile(filePath, withJsonTrailingNewline(json), "utf8");
}

async function updateWorkspaceVersions(appVersion: string): Promise<void> {
  for (const relativePath of WORKSPACE_PACKAGE_PATHS) {
    const filePath = resolve(rootDir, relativePath);
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw) as { version?: string };
    json.version = appVersion;
    await writeFile(filePath, withJsonTrailingNewline(json), "utf8");
  }
}

async function updateCapacitorAppNames(appName: string): Promise<void> {
  const targets = [
    {
      relativePath: "apps/mobile/capacitor.config.ts",
      label: "mobile capacitor appName",
    },
    {
      relativePath: "apps/electron/capacitor.config.ts",
      label: "electron capacitor appName",
    },
  ] as const;

  for (const target of targets) {
    const filePath = resolve(rootDir, target.relativePath);
    const content = await readFile(filePath, "utf8");
    const next = replaceOrThrow(
      content,
      /appName:\s*"[^"]*"/,
      `appName: "${appName}"`,
      target.label,
    );
    await writeFile(filePath, next, "utf8");
  }
}

async function updateAndroidAppNames(appName: string): Promise<void> {
  const filePath = resolve(rootDir, "apps/mobile/android/app/src/main/res/values/strings.xml");
  const content = await readFile(filePath, "utf8");
  const next = applyReplacementRules(content, [
    {
      pattern: /<string name="app_name">[\s\S]*?<\/string>/,
      replacement: `<string name="app_name">${appName}</string>`,
      label: "android app_name",
    },
    {
      pattern: /<string name="title_activity_main">[\s\S]*?<\/string>/,
      replacement: `<string name="title_activity_main">${appName}</string>`,
      label: "android title_activity_main",
    },
  ]);
  await writeFile(filePath, next, "utf8");
}

async function updateIosDisplayName(appName: string): Promise<void> {
  const filePath = resolve(rootDir, "apps/mobile/ios/App/App/Info.plist");
  const content = await readFile(filePath, "utf8");
  const next = replaceOrThrow(
    content,
    /(<key>CFBundleDisplayName<\/key>\s*<string>)[\s\S]*?(<\/string>)/,
    `$1${appName}$2`,
    "iOS CFBundleDisplayName",
  );
  await writeFile(filePath, next, "utf8");
}

async function updateAndroidVersionInfo(appVersion: string, appBuildNumber: number): Promise<void> {
  const filePath = resolve(rootDir, "apps/mobile/android/app/build.gradle");
  const content = await readFile(filePath, "utf8");
  const next = applyReplacementRules(content, [
    {
      pattern: /versionCode\s+\d+/,
      replacement: `versionCode ${String(appBuildNumber)}`,
      label: "android versionCode",
    },
    {
      pattern: /versionName\s+"[^"]*"/,
      replacement: `versionName "${appVersion}"`,
      label: "android versionName",
    },
  ]);
  await writeFile(filePath, next, "utf8");
}

async function updateIosVersionInfo(appVersion: string, appBuildNumber: number): Promise<void> {
  const filePath = resolve(rootDir, "apps/mobile/ios/App/App.xcodeproj/project.pbxproj");
  const content = await readFile(filePath, "utf8");
  const next = applyReplacementRules(content, [
    {
      pattern: /MARKETING_VERSION = [^;]+;/g,
      replacement: `MARKETING_VERSION = ${appVersion};`,
      label: "iOS MARKETING_VERSION",
    },
    {
      pattern: /CURRENT_PROJECT_VERSION = [^;]+;/g,
      replacement: `CURRENT_PROJECT_VERSION = ${String(appBuildNumber)};`,
      label: "iOS CURRENT_PROJECT_VERSION",
    },
  ]);
  await writeFile(filePath, next, "utf8");
}

async function updateBridgeApiVersion(apiVersion: string): Promise<void> {
  const major = apiVersion.split(".")[0] ?? "1";
  const constantsPath = resolve(
    rootDir,
    "packages/capacitor-electron/src/shared/protocol/constants.ts",
  );
  const readmePath = resolve(rootDir, "packages/capacitor-electron/README.md");

  const constants = await readFile(constantsPath, "utf8");
  const nextConstants = applyReplacementRules(constants, [
    {
      pattern: /BRIDGE_PROTOCOL_VERSION = "[^"]+"/,
      replacement: `BRIDGE_PROTOCOL_VERSION = "${apiVersion}"`,
      label: "bridge protocol version",
    },
    {
      pattern: /BRIDGE_INVOKE_CHANNEL = "[^"]+"/,
      replacement: `BRIDGE_INVOKE_CHANNEL = "crosscraft:cap-electron:v${major}:invoke"`,
      label: "bridge invoke channel version",
    },
  ]);
  await writeFile(constantsPath, nextConstants, "utf8");

  const readme = await readFile(readmePath, "utf8");
  const nextReadme = replaceOrThrow(
    readme,
    /- Protocol version: `[^`]+`/,
    `- Protocol version: \`${apiVersion}\``,
    "bridge README protocol version",
  );
  await writeFile(readmePath, nextReadme, "utf8");
}

type SyncUpdater = {
  label: string;
  execute(config: {
    appName: string;
    appVersion: string;
    appBuildNumber: number;
    apiVersion: string;
  }): Promise<void>;
};

const syncUpdaters: readonly SyncUpdater[] = [
  {
    label: "workspace package versions",
    execute: async ({ appVersion }) => updateWorkspaceVersions(appVersion),
  },
  {
    label: "frontend title",
    execute: async ({ appName }) => updateFrontendTitle(appName),
  },
  {
    label: "electron package product info",
    execute: async ({ appName, appVersion }) =>
      updateElectronPackageProductName(appName, appVersion),
  },
  {
    label: "capacitor app names",
    execute: async ({ appName }) => updateCapacitorAppNames(appName),
  },
  {
    label: "android app names",
    execute: async ({ appName }) => updateAndroidAppNames(appName),
  },
  {
    label: "iOS display name",
    execute: async ({ appName }) => updateIosDisplayName(appName),
  },
  {
    label: "android version info",
    execute: async ({ appVersion, appBuildNumber }) =>
      updateAndroidVersionInfo(appVersion, appBuildNumber),
  },
  {
    label: "iOS version info",
    execute: async ({ appVersion, appBuildNumber }) =>
      updateIosVersionInfo(appVersion, appBuildNumber),
  },
  {
    label: "bridge api version",
    execute: async ({ apiVersion }) => updateBridgeApiVersion(apiVersion),
  },
];

async function main(): Promise<void> {
  const config = loadAppConfig(import.meta.url);
  for (const updater of syncUpdaters) {
    await updater.execute(config);
  }
  console.log(
    `[sync-app-config] synced appName="${config.appName}" appVersion="${config.appVersion}" build=${String(config.appBuildNumber)} apiVersion="${config.apiVersion}"`,
  );
}

await main();
