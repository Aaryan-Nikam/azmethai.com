import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "azmeth", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "azmeth", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "azmeth", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "azmeth", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "azmeth", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "azmeth", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "azmeth", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "azmeth"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "azmeth", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "azmeth", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "azmeth", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "azmeth", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "azmeth", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "azmeth", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "azmeth", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "azmeth", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "azmeth", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "azmeth", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "azmeth", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "azmeth", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "azmeth", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "azmeth", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node", "azmeth", "status"],
    });
    expect(nodeArgv).toEqual(["node", "azmeth", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node-22", "azmeth", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "azmeth", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node-22.2.0.exe", "azmeth", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "azmeth", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node-22.2", "azmeth", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "azmeth", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node-22.2.exe", "azmeth", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "azmeth", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["/usr/bin/node-22.2.0", "azmeth", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "azmeth", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["nodejs", "azmeth", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "azmeth", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["node-dev", "azmeth", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "azmeth", "node-dev", "azmeth", "status"]);

    const directArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["azmeth", "status"],
    });
    expect(directArgv).toEqual(["node", "azmeth", "status"]);

    const bunArgv = buildParseArgv({
      programName: "azmeth",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "azmeth",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "azmeth", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "azmeth", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "azmeth", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "azmeth", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "azmeth", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "azmeth", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "azmeth", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "azmeth", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
