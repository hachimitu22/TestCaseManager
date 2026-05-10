import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createEmptyTestsuite,
  defaultConfig,
  type TcmConfig,
  type Testcase,
  type Testsuite,
  type TestsuiteItem
} from "./domain.js";
import { testcaseFromXml, testcaseToXml, testsuiteFromXml, testsuiteToXml } from "./xml.js";

const configFileName = "tcm.config.json";
const suiteFileName = "suite.xml";
const testcaseFileName = "testcase.xml";

export function configPath(workspaceDir: string): string {
  return path.join(workspaceDir, configFileName);
}

export async function initWorkspace(configDir: string, workspaceDir: string): Promise<TcmConfig> {
  const config: TcmConfig = {
    ...defaultConfig,
    workspaceDir: path.normalize(workspaceDir)
  };
  const resolvedWorkspaceDir = resolveWorkspaceDir(configDir, config);
  await mkdir(storageRoot(resolvedWorkspaceDir, config), { recursive: true });
  await writeTestsuite(resolvedWorkspaceDir, config, createEmptyTestsuite("", config.defaultSuiteName));
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

function storageRoot(workspaceDir: string, config: TcmConfig): string {
  return path.join(workspaceDir, config.storageDir);
}

function toPathId(id: string): string {
  const trimmed = id.trim();
  if (trimmed === "." || trimmed === "/") {
    return "";
  }
  return trimmed.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}

function splitPathId(id: string): string[] {
  const normalized = toPathId(id);
  if (!normalized) {
    return [];
  }
  return normalized.split("/").map(sanitizeResourceName);
}

function joinPathId(parentId: string, name: string): string {
  return [...splitPathId(parentId), sanitizeResourceName(name)].join("/");
}

function suiteDir(workspaceDir: string, config: TcmConfig, id: string): string {
  return path.join(storageRoot(workspaceDir, config), ...splitPathId(id));
}

function suiteXmlPath(workspaceDir: string, config: TcmConfig, id: string): string {
  return path.join(suiteDir(workspaceDir, config, id), suiteFileName);
}

function testcaseDir(workspaceDir: string, config: TcmConfig, id: string): string {
  return path.join(storageRoot(workspaceDir, config), ...splitPathId(id));
}

function testcaseXmlPath(workspaceDir: string, config: TcmConfig, id: string): string {
  return path.join(testcaseDir(workspaceDir, config, id), testcaseFileName);
}

export function sanitizeResourceName(name: string): string {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "default";
}

export const sanitizeTestsuiteId = sanitizeResourceName;

function basenameFromId(id: string): string {
  const parts = splitPathId(id);
  return parts.at(-1) ?? "";
}

function itemId(parentId: string, item: TestsuiteItem): string {
  return joinPathId(parentId, item.name);
}

function normalizedItems(testsuite: Testsuite): TestsuiteItem[] {
  const items: TestsuiteItem[] = [];
  const seen = new Map<string, TestsuiteItem["kind"]>();
  const add = (item: TestsuiteItem): void => {
    const name = sanitizeResourceName(item.name);
    const existingKind = seen.get(name);
    if (existingKind) {
      if (existingKind !== item.kind) {
        throw new Error(`Resource name conflicts in this testsuite: ${name}`);
      }
      return;
    }
    seen.set(name, item.kind);
    items.push({ kind: item.kind, name });
  };

  for (const item of testsuite.items ?? []) {
    add(item);
  }
  for (const testcase of testsuite.testcases ?? []) {
    add({ kind: "testcase", name: basenameFromId(testcase.id) || testcase.id });
  }
  return items;
}

async function readTestcase(workspaceDir: string, config: TcmConfig, id: string): Promise<Testcase> {
  const testcase = testcaseFromXml(await readFile(testcaseXmlPath(workspaceDir, config, id), "utf8"));
  return {
    ...testcase,
    id: toPathId(id)
  };
}

async function writeTestcase(workspaceDir: string, config: TcmConfig, testcase: Testcase): Promise<void> {
  const id = toPathId(testcase.id);
  const normalized: Testcase = {
    ...testcase,
    id
  };
  await mkdir(testcaseDir(workspaceDir, config, id), { recursive: true });
  await writeFile(testcaseXmlPath(workspaceDir, config, id), testcaseToXml(normalized), "utf8");
}

export async function listTestsuites(workspaceDir: string, config: TcmConfig): Promise<Array<{ id: string; name: string }>> {
  const root = await readTestsuite(workspaceDir, config, "");
  const summaries = [];
  for (const item of root?.items ?? []) {
    if (item.kind !== "testsuite") {
      continue;
    }
    const suite = await readTestsuite(workspaceDir, config, item.name);
    summaries.push({ id: item.name, name: suite?.name ?? item.name });
  }
  return summaries;
}

export async function readTestsuite(workspaceDir: string, config: TcmConfig, id: string): Promise<Testsuite | null> {
  const normalizedId = toPathId(id);
  try {
    const testsuite = testsuiteFromXml(await readFile(suiteXmlPath(workspaceDir, config, normalizedId), "utf8"));
    const items = (testsuite.items ?? []).map((item) => ({
      ...item,
      name: sanitizeResourceName(item.name)
    }));
    const testcases = [];
    for (const item of items) {
      if (item.kind === "testcase") {
        testcases.push(await readTestcase(workspaceDir, config, itemId(normalizedId, item)));
      }
    }
    return {
      ...testsuite,
      id: normalizedId,
      name: testsuite.name || basenameFromId(normalizedId) || defaultConfig.defaultSuiteName,
      items,
      testcases
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeTestsuite(workspaceDir: string, config: TcmConfig, testsuite: Testsuite): Promise<void> {
  const id = toPathId(testsuite.id);
  const items = normalizedItems(testsuite);
  const normalized: Testsuite = {
    ...testsuite,
    id,
    name: testsuite.name || basenameFromId(id) || defaultConfig.defaultSuiteName,
    items,
    testcases: testsuite.testcases ?? []
  };

  await mkdir(suiteDir(workspaceDir, config, id), { recursive: true });
  await writeFile(suiteXmlPath(workspaceDir, config, id), testsuiteToXml(normalized), "utf8");

  for (const testcase of normalized.testcases) {
    const name = sanitizeResourceName(basenameFromId(testcase.id) || testcase.id);
    await writeTestcase(workspaceDir, config, {
      ...testcase,
      id: joinPathId(id, name)
    });
  }
}

export async function createChildTestsuite(
  workspaceDir: string,
  config: TcmConfig,
  parentId: string,
  child: Testsuite
): Promise<Testsuite> {
  const parent = await readTestsuite(workspaceDir, config, parentId);
  if (!parent) {
    throw new Error(`Parent testsuite not found: ${parentId}`);
  }

  const name = sanitizeResourceName(child.name || basenameFromId(child.id) || child.id);
  if (parent.items.some((item) => item.name === name)) {
    throw new Error(`Resource already exists in this testsuite: ${name}`);
  }

  const id = joinPathId(parent.id, name);
  const childSuite = createEmptyTestsuite(id, child.name || name);
  await writeTestsuite(workspaceDir, config, {
    ...childSuite,
    items: child.items ?? [],
    testcases: child.testcases ?? []
  });
  await writeTestsuite(workspaceDir, config, {
    ...parent,
    items: [...parent.items, { kind: "testsuite", name }]
  });

  return (await readTestsuite(workspaceDir, config, id))!;
}

export async function deleteTestsuiteTree(workspaceDir: string, config: TcmConfig, id: string): Promise<void> {
  const normalizedId = toPathId(id);
  if (!normalizedId) {
    throw new Error("Root testsuite cannot be deleted");
  }

  const parentId = splitPathId(normalizedId).slice(0, -1).join("/");
  const name = basenameFromId(normalizedId);
  const parent = await readTestsuite(workspaceDir, config, parentId);
  if (parent) {
    await writeTestsuite(workspaceDir, config, {
      ...parent,
      items: parent.items.filter((item) => item.name !== name)
    });
  }

  const target = suiteDir(workspaceDir, config, normalizedId);
  const root = path.resolve(storageRoot(workspaceDir, config));
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to delete outside storage root: ${resolvedTarget}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
}
