import { LaunchProps, showHUD } from "@raycast/api";
import { copyErrorToClipboard } from "./errors";
import { setSpeedScript } from "./speed-script";
import { GatherNotFocusedError, runGatherConsole } from "./teleport-utils";

export default async function main(props: LaunchProps<{ arguments: { speed?: string } }>) {
  try {
    const speed = props.arguments?.speed || "4";
    const result = await runGatherConsole(setSpeedScript(speed), { resetRaycast: true });
    if (result.startsWith("GATHERCHEATS_ERROR:")) {
      throw new Error(result.slice("GATHERCHEATS_ERROR:".length).trim());
    }
    if (result !== "GATHERCHEATS_OK") {
      throw new Error(`Gather returned an unexpected response: ${result || "<empty>"}`);
    }
    await showHUD(
      speed === "1"
        ? "Gather speed reset to 1× — auto-reapply off"
        : `Gather speed set to ${speed}× — reapplies every minute`,
    );
  } catch (error) {
    if (error instanceof GatherNotFocusedError) {
      await showHUD(error.message);
      return;
    }
    const copied = await copyErrorToClipboard("Set Gather Speed", error);
    await showHUD(copied ? "Could not set Gather speed — error copied" : "Could not set Gather speed");
  }
}
