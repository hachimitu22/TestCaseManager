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
  it("creates, saves, and reloads a testsuite", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "tcm-"));
    await initWorkspace(dir, "workspace");
    const app = await createApp({ configDir: dir });

    server = app.listen(0);
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

    const body = {
      id: "sample",
      name: "Sample",
      testcases: [
        {
          id: "case-1",
          title: "Sample testcase",
          format: "AAA",
          content: { arrange: "A", act: "B", assert: "C" },
          notes: "created from API"
        }
      ]
    };

    const saveResponse = await fetch(`${baseUrl}/api/test-suites/sample`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    expect(saveResponse.status).toBe(200);
    await expect(saveResponse.json()).resolves.toEqual(body);

    const detail = await fetch(`${baseUrl}/api/test-suites/sample`);
    await expect(detail.json()).resolves.toEqual(body);
  });
});
