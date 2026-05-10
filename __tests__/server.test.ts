import { mkdtemp } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { initWorkspace } from "../src/workspace.js";

let server: http.Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

describe("test-suites API", () => {
  async function start(): Promise<string> {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    await initWorkspace(dir, "workspace");
    const app = await createApp({ configDir: dir });

    server = app.listen(0);
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    const address = server.address();
    return `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  }

  it("creates child testsuites under the root suite", async () => {
    const baseUrl = await start();

    const childResponse = await fetch(`${baseUrl}/api/root-testsuite/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "checkout" })
    });

    expect(childResponse.status).toBe(201);
    await expect(childResponse.json()).resolves.toMatchObject({
      id: "checkout",
      name: "checkout",
      items: [],
      testcases: []
    });

    const root = await fetch(`${baseUrl}/api/root-testsuite`);
    await expect(root.json()).resolves.toMatchObject({
      id: "",
      items: [{ kind: "testsuite", name: "checkout" }]
    });

    const list = await fetch(`${baseUrl}/api/test-suites`);
    await expect(list.json()).resolves.toEqual([{ id: "checkout", name: "checkout" }]);
  });

  it("saves testcases as items of a path-based testsuite and deletes subtrees", async () => {
    const baseUrl = await start();
    await fetch(`${baseUrl}/api/root-testsuite/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "checkout" })
    });

    const body = {
      id: "checkout",
      name: "checkout",
      items: [{ kind: "testcase", name: "pay" }],
      testcases: [
        {
          id: "checkout/pay",
          title: "Pay",
          format: "TEXT",
          content: { text: "payment succeeds" },
          notes: "created from API"
        }
      ]
    };

    const saveResponse = await fetch(`${baseUrl}/api/test-suites/checkout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    expect(saveResponse.status).toBe(200);
    await expect(saveResponse.json()).resolves.toMatchObject(body);

    const deleteResponse = await fetch(`${baseUrl}/api/test-suites/checkout`, { method: "DELETE" });
    expect(deleteResponse.status).toBe(204);

    const root = await fetch(`${baseUrl}/api/root-testsuite`);
    await expect(root.json()).resolves.toMatchObject({ id: "", items: [] });
  });
});
