import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".azmeth"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", AZMETH_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".azmeth-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", AZMETH_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".azmeth"));
  });

  it("uses AZMETH_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", AZMETH_STATE_DIR: "/var/lib/azmeth" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/azmeth"));
  });

  it("expands ~ in AZMETH_STATE_DIR", () => {
    const env = { HOME: "/Users/test", AZMETH_STATE_DIR: "~/azmeth-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/azmeth-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { AZMETH_STATE_DIR: "C:\\State\\azmeth" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\azmeth");
  });
});
