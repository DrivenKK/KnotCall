import { execSync, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

const PORT = process.env.PORT || "3000";

function killPort(port) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        } catch {
          // Process may have already exited.
        }
      }
    } catch {
      // Nothing listening on this port.
    }
    return;
  }

  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    // Nothing listening on this port.
  }
}

killPort(PORT);
rmSync(".next", { recursive: true, force: true });

const result = spawnSync("next", ["dev"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
