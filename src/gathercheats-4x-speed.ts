import { LaunchProps, showHUD } from "@raycast/api";
import { copyErrorToClipboard } from "./errors";
import { GatherNotFocusedError, runGatherConsole } from "./teleport-utils";

export default async function main(props: LaunchProps<{ arguments: { speed?: string } }>) {
  try {
    const speed = props.arguments?.speed || "4";
    if (!["1", "2", "3", "4"].includes(speed)) {
      throw new Error(`Invalid speed: ${speed}. Choose 1, 2, 3, or 4.`);
    }

    const result = await runGatherConsole(
      `try { game.setSpeedModifier(${speed}); copy('GATHERCHEATS_OK'); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : '')); }`,
      { resetRaycast: true },
    );
    if (result.startsWith("GATHERCHEATS_ERROR:")) {
      throw new Error(result.slice("GATHERCHEATS_ERROR:".length).trim());
    }
    if (result !== "GATHERCHEATS_OK") {
      throw new Error(`Gather returned an unexpected response: ${result || "<empty>"}`);
    }
    await showHUD(`Gather speed set to ${speed}×`);
  } catch (error) {
    if (error instanceof GatherNotFocusedError) {
      await showHUD(error.message);
      return;
    }
    const copied = await copyErrorToClipboard("Set Gather Speed", error);
    await showHUD(copied ? "Could not set Gather speed — error copied" : "Could not set Gather speed");
  }
}
