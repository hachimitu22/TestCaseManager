import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultConfig, type TcmConfig, type Testsuite } from "./domain.js";
import { testsuiteFromXml, testsuiteToXml } from "./xml.js";

const configFileName = "tcm.config.json";

export function configPath(workspaceDir: string): string {
  return path.join(workspaceDir, configFileName);
}

export async function initWorkspace(configDir: string, workspaceDir: string): Promise<TcmConfig> {
  const config: TcmConfig = {
    ...defaultConfig,
    workspaceDir: path.normalize(workspaceDir)
  };
  const resolvedWorkspaceDir = resolveWorkspaceDir(configDir, config);
  await mkdir(path.join(resolvedWorkspaceDir, config.storageDir), { recursive: true });
  await writeFile(configPath(configDir), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return config;
}

export async function readConfig(workspaceDir: string): Promise<TcmConfig> {
  const raw = await readFile(configPath(workspaceDir), "utf8");
  return JSON.parse(raw) as TcmConfig;
}

export function resolveWorkspaceDir(configDir: string, config: TcmConfig): string {
  return path.isAbsolute(config.workspaceDir)
    ? config.workspaceDir
    : path.resolve(configDir, config.workspaceDir);
}

export function testsuitePath(workspaceDir: string, config: TcmConfig, id: string): string {
  return path.join(workspaceDir, config.storageDir, `${sanitizeTestsuiteId(id)}.xml`);
}

export function sanitizeTestsuiteId(id: string): string {
  const sanitized = id.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "default";
}

export async function listTestsuites(workspaceDir: string, config: TcmConfig): Promise<Array<{ id: string; name: string }>> {
  const storageDir = path.join(workspaceDir, config.storageDir);
  await mkdir(storageDir, { recursive: true });
  const entries = await readdir(storageDir, { withFileTypes: true });
  const suites = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".xml")) {
      continue;
    }

    const xml = await readFile(path.join(storageDir, entry.name), "utf8");
    const testsuite = testsuiteFromXml(xml);
    suites.push({ id: testsuite.id, name: testsuite.name });
  }

  return suites.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readTestsuite(workspaceDir: string, config: TcmConfig, id: string): Promise<Testsuite | null> {
  try {
    const xml = await readFile(testsuitePath(workspaceDir, config, id), "utf8");
    return testsuiteFromXml(xml);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeTestsuite(workspaceDir: string, config: TcmConfig, testsuite: Testsuite): Promise<void> {
  const normalized: Testsuite = {
    ...testsuite,
    id: sanitizeTestsuiteId(testsuite.id)
  };
  await mkdir(path.join(workspaceDir, config.storageDir), { recursive: true });
  await writeFile(testsuitePath(workspaceDir, config, normalized.id), testsuiteToXml(normalized), "utf8");
}
