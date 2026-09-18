import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import type { ScenarioId } from "./manifest";

function backendRoot(): string {
  const value = process.env.FINAL_GATE_BACKEND_ROOT;
  if (!value) throw new Error("FINAL_GATE_BACKEND_ROOT is required");
  return resolve(value);
}

function run(script: string, scenario: ScenarioId, args: string[] = []) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath is required for scenario lifecycle");
  execFileSync(process.execPath, [npmCli, "run", script, "--", ...args], {
    cwd: backendRoot(),
    env: { ...process.env, FINAL_GATE_SCENARIO: scenario },
    stdio: "inherit",
  });
}

export function prepareScenario(scenario: ScenarioId) {
  run("final-gate:reset", scenario);
  run("final-gate:seed", scenario);
  run("final-gate:validate", scenario);
  run("final-gate:audit", scenario);
}

export function completeScenario(scenario: ScenarioId) {
  try {
    run("final-gate:audit", scenario, ["--after"]);
  } finally {
    run("final-gate:reset", scenario);
  }
}
