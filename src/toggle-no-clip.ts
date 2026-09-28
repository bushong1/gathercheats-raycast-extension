import { showHUD } from "@raycast/api";
import { copyErrorToClipboard } from "./errors";
import { installNoClipScript, toggleInstalledNoClipScript } from "./no-clip-script";
import { GatherNotFocusedError, runGatherConsole } from "./teleport-utils";

export default async function main() {
  try {
    let result = await runGatherConsole(toggleInstalledNoClipScript, { resultTimeoutSeconds: 30 });
    if (result === "GATHERCHEATS_NO_CLIP_INSTALL") {
      result = await runGatherConsole(installNoClipScript, { resultTimeoutSeconds: 30, settleSeconds: 1 });
    }
    if (result.startsWith("GATHERCHEATS_ERROR:")) {
      throw new Error(result.slice("GATHERCHEATS_ERROR:".length).trim());
    }
    if (result === "GATHERCHEATS_NO_CLIP_ON") {
      await showHUD("No-clip enabled — hold an arrow key to teleport");
    } else if (result === "GATHERCHEATS_NO_CLIP_OFF") {
      await showHUD("No-clip disabled");
    } else {
      throw new Error(`Gather returned an unexpected response: ${result || "<empty>"}`);
    }
  } catch (error) {
    if (error instanceof GatherNotFocusedError) {
      await showHUD(error.message);
      return;
    }
    const copied = await copyErrorToClipboard("Toggle No-Clip", error);
    await showHUD(copied ? "Could not toggle no-clip — error copied" : "Could not toggle no-clip");
  }
}
