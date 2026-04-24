type StateDirEnvSnapshot = {
  azmethStateDir: string | undefined;
  clawdbotStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    azmethStateDir: process.env.AZMETH_STATE_DIR,
    clawdbotStateDir: process.env.CLAWDBOT_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.azmethStateDir === undefined) {
    delete process.env.AZMETH_STATE_DIR;
  } else {
    process.env.AZMETH_STATE_DIR = snapshot.azmethStateDir;
  }
  if (snapshot.clawdbotStateDir === undefined) {
    delete process.env.CLAWDBOT_STATE_DIR;
  } else {
    process.env.CLAWDBOT_STATE_DIR = snapshot.clawdbotStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.AZMETH_STATE_DIR = stateDir;
  delete process.env.CLAWDBOT_STATE_DIR;
}
