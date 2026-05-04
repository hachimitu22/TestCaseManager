#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { startServer } from "./server.js";
import { initWorkspace } from "./workspace.js";

const program = new Command();

program.name("tcm").description("TestCaseManager CLI").version("0.0.0");

program
  .command("init")
  .argument("<dir>", "workspace directory")
  .description("Initialize a TestCaseManager workspace")
  .action(async (dir: string) => {
    const rootDir = process.cwd();
    const workspaceDir = path.resolve(rootDir, dir);
    await initWorkspace(rootDir, dir);
    console.log(`Initialized tcm workspace: ${workspaceDir}`);
  });

program
  .command("server")
  .option("-p, --port <port>", "port to listen on", "3000")
  .description("Start the local TestCaseManager server")
  .action(async (options: { port: string }) => {
    const port = Number.parseInt(options.port, 10);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`Invalid port: ${options.port}`);
    }
    await startServer(process.cwd(), port);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
