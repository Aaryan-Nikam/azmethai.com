import type {
  AnyAgentTool,
  AzmethPluginApi,
  AzmethPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: AzmethPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as AzmethPluginToolFactory,
    { optional: true },
  );
}
