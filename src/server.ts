import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEmptyTestsuite } from "./domain.js";
import { listTestsuites, readConfig, readTestsuite, resolveWorkspaceDir, writeTestsuite } from "./workspace.js";

export interface ServerOptions {
  configDir: string;
}

export async function createApp(options: ServerOptions): Promise<express.Express> {
  const config = await readConfig(options.configDir);
  const workspaceDir = resolveWorkspaceDir(options.configDir, config);
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/test-suites", async (_request, response, next) => {
    try {
      response.json(await listTestsuites(workspaceDir, config));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/test-suites/:id", async (request, response, next) => {
    try {
      const testsuite = await readTestsuite(workspaceDir, config, request.params.id);
      response.json(testsuite ?? createEmptyTestsuite(request.params.id, config.defaultSuiteName));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/test-suites/:id", async (request, response, next) => {
    try {
      await writeTestsuite(workspaceDir, config, {
        ...request.body,
        id: request.params.id
      });
      const saved = await readTestsuite(workspaceDir, config, request.params.id);
      response.json(saved);
    } catch (error) {
      next(error);
    }
  });

  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const webDir = path.resolve(dirname, "../web");
  app.use(express.static(webDir));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(webDir, "index.html"));
  });

  return app;
}

export async function startServer(workspaceDir: string, port: number): Promise<void> {
  const app = await createApp({ configDir: workspaceDir });
  app.listen(port, () => {
    console.log(`tcm server listening on http://localhost:${port}`);
  });
}
