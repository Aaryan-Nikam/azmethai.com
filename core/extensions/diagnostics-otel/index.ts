import type { AzmethPluginApi } from "azmeth/plugin-sdk";
import { emptyPluginConfigSchema } from "azmeth/plugin-sdk";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: AzmethPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
