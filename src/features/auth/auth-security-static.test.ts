import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function runtimeSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return runtimeSourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)
      ? [path]
      : [];
  });
}

describe("FE-0 runtime security cutover", () => {
  const files = runtimeSourceFiles(join(process.cwd(), "src"));
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

  it("contains no deployable fixed OTP or advertised test login", () => {
    expect(source).not.toContain("STUB_OTP_CODE");
    expect(source).not.toContain("test@creator.com");
    expect(source).not.toMatch(/\b123456\b/);
  });

  it("contains no legacy Brand complete-registration request", () => {
    expect(source).not.toContain("completeBrandRegistration");
    expect(source).not.toContain("/api/v1/auth/brand/complete-registration");
    expect(source).not.toContain("CompleteBrandRegistrationResponseBody");
  });

  it("does not write authentication state to browser storage", () => {
    const authSource = [
      join(process.cwd(), "src", "shared", "auth"),
      join(process.cwd(), "src", "features", "auth"),
    ]
      .flatMap(runtimeSourceFiles)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(authSource).not.toMatch(
      /localStorage\.setItem|sessionStorage\.setItem/,
    );
    expect(authSource).not.toMatch(/indexedDB|document\.cookie/);
  });

  it("has no obsolete direct authorization helper in runtime source", () => {
    expect(source).not.toContain("authAuthorizationHeader");
    expect(source).not.toContain("loadAuthSession");
    expect(source).not.toContain("saveAuthSession");
  });
});
