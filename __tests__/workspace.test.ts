import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyTestsuite } from "../src/domain.js";
import { createChildTestsuite, deleteTestsuiteTree, initWorkspace, listTestsuites, readConfig, readTestsuite, writeTestsuite } from "../src/workspace.js";

describe("workspace", () => {
  it("initializes config, storage root, and root suite XML", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    await initWorkspace(dir, "workspace");

    const config = await readConfig(dir);
    expect(config.workspaceDir).toBe("workspace");
    expect(config.storageDir).toBe("test-suites");
    await expect(readFile(path.join(dir, "tcm.config.json"), "utf8")).resolves.toContain("defaultSuiteName");
    await expect(readFile(path.join(dir, "workspace", "test-suites", "suite.xml"), "utf8")).resolves.toContain("<testsuite");
  });

  it("stores testsuites and testcases as matching directories", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    const config = await initWorkspace(dir, "workspace");
    const workspaceDir = path.join(dir, "workspace");
    const checkout = await createChildTestsuite(workspaceDir, config, "", createEmptyTestsuite("", "checkout"));

    await writeTestsuite(workspaceDir, config, {
      ...checkout,
      items: [{ kind: "testcase", name: "pay" }],
      testcases: [
        {
          id: "checkout/pay",
          title: "Pay",
          format: "TEXT",
          content: { text: "payment succeeds" },
          notes: "minimum MVP case"
        }
      ]
    });

    await expect(listTestsuites(workspaceDir, config)).resolves.toEqual([{ id: "checkout", name: "checkout" }]);
    await expect(readFile(path.join(workspaceDir, "test-suites", "checkout", "suite.xml"), "utf8")).resolves.toContain("<testcase-ref name=\"pay\" />");
    await expect(readFile(path.join(workspaceDir, "test-suites", "checkout", "pay", "testcase.xml"), "utf8")).resolves.toContain("<testcase>");
    await expect(readTestsuite(workspaceDir, config, "checkout")).resolves.toMatchObject({
      id: "checkout",
      items: [{ kind: "testcase", name: "pay" }],
      testcases: [{ id: "checkout/pay", title: "Pay" }]
    });
  });

  it("allows the same name in different branches and deletes a subtree", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    const config = await initWorkspace(dir, "workspace");
    const workspaceDir = path.join(dir, "workspace");

    await createChildTestsuite(workspaceDir, config, "", createEmptyTestsuite("", "checkout"));
    await createChildTestsuite(workspaceDir, config, "checkout", createEmptyTestsuite("", "case"));
    await createChildTestsuite(workspaceDir, config, "", createEmptyTestsuite("", "settings"));
    await createChildTestsuite(workspaceDir, config, "settings", createEmptyTestsuite("", "case"));

    await expect(readTestsuite(workspaceDir, config, "checkout/case")).resolves.toMatchObject({ id: "checkout/case" });
    await expect(readTestsuite(workspaceDir, config, "settings/case")).resolves.toMatchObject({ id: "settings/case" });

    await deleteTestsuiteTree(workspaceDir, config, "checkout");

    await expect(readTestsuite(workspaceDir, config, "checkout")).resolves.toBeNull();
    await expect(readTestsuite(workspaceDir, config, "settings/case")).resolves.toMatchObject({ id: "settings/case" });
    await expect(readTestsuite(workspaceDir, config, "")).resolves.toMatchObject({
      items: [{ kind: "testsuite", name: "settings" }]
    });
  });
});
