/**
 * Frees a TCP port before starting dev (Windows-focused).
 * Usage: node scripts/free-port.mjs 3000
 */
import { execSync } from "node:child_process";

const port = process.argv[2] ?? "3000";

function freePortWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr ":${targetPort}" | findstr "LISTENING"`, {
      encoding: "utf8",
    });

    const pids = new Set(
      output
        .split("\n")
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && pid !== "0"),
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Freed port ${targetPort} (stopped PID ${pid})`);
      } catch {
        // process may already be gone
      }
    }

    if (pids.size === 0) {
      console.log(`Port ${targetPort} is already free`);
    }
  } catch {
    console.log(`Port ${targetPort} is already free`);
  }
}

if (process.platform === "win32") {
  freePortWindows(port);
} else {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null`, { stdio: "ignore", shell: true });
    console.log(`Freed port ${port}`);
  } catch {
    console.log(`Port ${port} is already free`);
  }
}
