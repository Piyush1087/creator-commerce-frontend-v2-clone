import { chromium, type FullConfig } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";

import {
  artifactPath,
  installLoopbackGuard,
  writeSanitizedJson,
} from "./helpers";
import { ROLE_EMAILS } from "./manifest";

export default async function generateFinalGateSessions(config: FullConfig) {
  if (process.env.CANONICAL_FINAL_GATE_DISPOSABLE_RUN !== "true") {
    throw new Error("CANONICAL_FINAL_GATE_DISPOSABLE_RUN=true is required");
  }
  const password = process.env.FINAL_GATE_FIXTURE_PASSWORD;
  if (!password) throw new Error("FINAL_GATE_FIXTURE_PASSWORD is required");
  const baseURL = String(
    config.projects[0]?.use?.baseURL ?? "http://127.0.0.1:5173",
  );
  if (!new URL(baseURL).hostname.match(/^(localhost|127\.0\.0\.1|\[::1\])$/)) {
    throw new Error("Final Gate sessions require a loopback frontend");
  }
  const sessionDir = artifactPath("sessions");
  await rm(sessionDir, { recursive: true, force: true });
  await mkdir(sessionDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest: Array<{
    role: string;
    email: string;
    userRole: string;
    workspaceVerified: boolean;
  }> = [];
  try {
    for (const [role, email] of Object.entries(ROLE_EMAILS)) {
      const context = await browser.newContext();
      const blocked: string[] = [];
      await installLoopbackGuard(context, blocked);
      const page = await context.newPage();
      await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
      await page.getByLabel(/email/i).fill(email);
      await page.locator('input[type="password"]').fill(password);
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/auth/login") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: /^sign in$/i }).click();
      const response = await responsePromise;
      if (response.status() !== 200)
        throw new Error(`ROLE_SESSION_VERIFICATION_FAILURE:${role}`);
      const session = (await response.json()) as {
        accessToken?: string;
        user?: { email?: string; role?: string };
      };
      if (!session.accessToken || session.user?.email !== email)
        throw new Error(`ROLE_SESSION_IDENTITY_MISMATCH:${role}`);
      const me = await context.request.get(
        "http://127.0.0.1:3000/api/v1/auth/me",
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );
      if (!me.ok()) throw new Error(`ROLE_SESSION_ME_FAILURE:${role}`);
      const resolved = (await me.json()) as {
        email?: string;
        role?: string;
        creatorProfile?: unknown;
        brandMemberships?: unknown[];
      };
      let workspaceVerified = Boolean(resolved.brandMemberships?.length);
      if (role.startsWith("CREATOR_")) {
        const actor = await context.request.get(
          "http://127.0.0.1:3000/api/v1/creator/workspace/actor-context",
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        if (!actor.ok())
          throw new Error(`ROLE_WORKSPACE_CONTEXT_FAILURE:${role}`);
        const actorContext = (await actor.json()) as {
          actor_user_id?: string;
          workspace_id?: string;
        };
        workspaceVerified = Boolean(
          actorContext.actor_user_id && actorContext.workspace_id,
        );
      }
      if (resolved.email !== email || !workspaceVerified)
        throw new Error(`ROLE_WORKSPACE_VERIFICATION_FAILURE:${role}`);
      await context.storageState({
        path: artifactPath("sessions", `${role.toLowerCase()}.json`),
      });
      manifest.push({
        role,
        email,
        userRole: String(resolved.role),
        workspaceVerified,
      });
      if (blocked.length) throw new Error(`NON_LOOPBACK_REQUEST:${blocked[0]}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  await writeSanitizedJson(artifactPath("session-manifest.json"), {
    count: manifest.length,
    sessions: manifest,
  });
}
