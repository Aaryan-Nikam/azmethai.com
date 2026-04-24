import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "azmeth",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "azmeth", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "azmeth", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "azmeth", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "azmeth", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "azmeth", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "azmeth", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "azmeth", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "azmeth", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".azmeth-dev");
    expect(env.AZMETH_PROFILE).toBe("dev");
    expect(env.AZMETH_STATE_DIR).toBe(expectedStateDir);
    expect(env.AZMETH_CONFIG_PATH).toBe(path.join(expectedStateDir, "azmeth.json"));
    expect(env.AZMETH_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      AZMETH_STATE_DIR: "/custom",
      AZMETH_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.AZMETH_STATE_DIR).toBe("/custom");
    expect(env.AZMETH_GATEWAY_PORT).toBe("19099");
    expect(env.AZMETH_CONFIG_PATH).toBe(path.join("/custom", "azmeth.json"));
  });

  it("uses AZMETH_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      AZMETH_HOME: "/srv/azmeth-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/azmeth-home");
    expect(env.AZMETH_STATE_DIR).toBe(path.join(resolvedHome, ".azmeth-work"));
    expect(env.AZMETH_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".azmeth-work", "azmeth.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("azmeth doctor --fix", {})).toBe("azmeth doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("azmeth doctor --fix", { AZMETH_PROFILE: "default" })).toBe(
      "azmeth doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("azmeth doctor --fix", { AZMETH_PROFILE: "Default" })).toBe(
      "azmeth doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("azmeth doctor --fix", { AZMETH_PROFILE: "bad profile" })).toBe(
      "azmeth doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("azmeth --profile work doctor --fix", { AZMETH_PROFILE: "work" }),
    ).toBe("azmeth --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("azmeth --dev doctor", { AZMETH_PROFILE: "dev" })).toBe(
      "azmeth --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("azmeth doctor --fix", { AZMETH_PROFILE: "work" })).toBe(
      "azmeth --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("azmeth doctor --fix", { AZMETH_PROFILE: "  jbazmeth  " })).toBe(
      "azmeth --profile jbazmeth doctor --fix",
    );
  });

  it("handles command with no args after azmeth", () => {
    expect(formatCliCommand("azmeth", { AZMETH_PROFILE: "test" })).toBe(
      "azmeth --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm azmeth doctor", { AZMETH_PROFILE: "work" })).toBe(
      "pnpm azmeth --profile work doctor",
    );
  });
});
