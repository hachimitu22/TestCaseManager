import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyTestsuite } from "../src/domain.js";
import { initWorkspace, listTestsuites, readConfig, readTestsuite, writeTestsuite } from "../src/workspace.js";

describe("workspace", () => {
  it("initializes config and storage directory", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    await initWorkspace(dir, "workspace");

    const config = await readConfig(dir);
    expect(config.workspaceDir).toBe("workspace");
    expect(config.storageDir).toBe("test-suites");
    await expect(readFile(path.join(dir, "tcm.config.json"), "utf8")).resolves.toContain("defaultSuiteName");
    await expect(readFile(path.join(dir, "tcm.config.json"), "utf8")).resolves.toContain("workspaceDir");
  });

  it("saves, lists, and reads testsuites", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    const config = await initWorkspace(dir, "workspace");
    const workspaceDir = path.join(dir, "workspace");
    const testsuite = createEmptyTestsuite("checkout", "Checkout");
    testsuite.testcases.push({
      id: "pay",
      title: "Pay",
      format: "TEXT",
      content: { text: "payment succeeds" },
      notes: "minimum MVP case"
    });

    await writeTestsuite(workspaceDir, config, testsuite);

    await expect(listTestsuites(workspaceDir, config)).resolves.toEqual([{ id: "checkout", name: "Checkout" }]);
    await expect(readTestsuite(workspaceDir, config, "checkout")).resolves.toEqual(testsuite);
  });
});
