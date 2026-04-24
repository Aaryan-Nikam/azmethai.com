import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStorePath } from "./paths.js";

describe("resolveStorePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses AZMETH_HOME for tilde expansion", () => {
    vi.stubEnv("AZMETH_HOME", "/srv/azmeth-home");
    vi.stubEnv("HOME", "/home/other");

    const resolved = resolveStorePath("~/.azmeth/agents/{agentId}/sessions/sessions.json", {
      agentId: "research",
    });

    expect(resolved).toBe(
      path.resolve("/srv/azmeth-home/.azmeth/agents/research/sessions/sessions.json"),
    );
  });
});
