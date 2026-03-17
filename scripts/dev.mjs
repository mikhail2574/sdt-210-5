import { spawn } from "node:child_process";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const children = [];
let shuttingDown = false;

function startProcess(label, args) {
  const child = spawn(pnpmCommand, args, {
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    stopChildren(child.pid);

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`[${label}] failed to start`, error);
    stopChildren(child.pid);
    process.exit(1);
  });

  children.push(child);
  return child;
}

function stopChildren(skipPid) {
  for (const child of children) {
    if (!child.pid || child.pid === skipPid) {
      continue;
    }

    child.kill("SIGTERM");
  }
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChildren();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startProcess("api", ["run", "api:dev"]);
startProcess("web", ["run", "dev:web"]);
