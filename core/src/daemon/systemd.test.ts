import { describe, expect, it } from "vitest";
import { parseSystemdShow, resolveSystemdUserUnitPath } from "./systemd.js";

describe("systemd runtime parsing", () => {
  it("parses active state details", () => {
    const output = [
      "ActiveState=inactive",
      "SubState=dead",
      "MainPID=0",
      "ExecMainStatus=2",
      "ExecMainCode=exited",
    ].join("\n");
    expect(parseSystemdShow(output)).toEqual({
      activeState: "inactive",
      subState: "dead",
      execMainStatus: 2,
      execMainCode: "exited",
    });
  });
});

describe("resolveSystemdUserUnitPath", () => {
  it("uses default service name when AZMETH_PROFILE is default", () => {
    const env = { HOME: "/home/test", AZMETH_PROFILE: "default" };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway.service",
    );
  });

  it("uses default service name when AZMETH_PROFILE is unset", () => {
    const env = { HOME: "/home/test" };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway.service",
    );
  });

  it("uses profile-specific service name when AZMETH_PROFILE is set to a custom value", () => {
    const env = { HOME: "/home/test", AZMETH_PROFILE: "jbphoenix" };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway-jbphoenix.service",
    );
  });

  it("prefers AZMETH_SYSTEMD_UNIT over AZMETH_PROFILE", () => {
    const env = {
      HOME: "/home/test",
      AZMETH_PROFILE: "jbphoenix",
      AZMETH_SYSTEMD_UNIT: "custom-unit",
    };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/custom-unit.service",
    );
  });

  it("handles AZMETH_SYSTEMD_UNIT with .service suffix", () => {
    const env = {
      HOME: "/home/test",
      AZMETH_SYSTEMD_UNIT: "custom-unit.service",
    };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/custom-unit.service",
    );
  });

  it("trims whitespace from AZMETH_SYSTEMD_UNIT", () => {
    const env = {
      HOME: "/home/test",
      AZMETH_SYSTEMD_UNIT: "  custom-unit  ",
    };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/custom-unit.service",
    );
  });

  it("handles case-insensitive 'Default' profile", () => {
    const env = { HOME: "/home/test", AZMETH_PROFILE: "Default" };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway.service",
    );
  });

  it("handles case-insensitive 'DEFAULT' profile", () => {
    const env = { HOME: "/home/test", AZMETH_PROFILE: "DEFAULT" };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway.service",
    );
  });

  it("trims whitespace from AZMETH_PROFILE", () => {
    const env = { HOME: "/home/test", AZMETH_PROFILE: "  myprofile  " };
    expect(resolveSystemdUserUnitPath(env)).toBe(
      "/home/test/.config/systemd/user/azmeth-gateway-myprofile.service",
    );
  });
});
