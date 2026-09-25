import { showHUD } from "@raycast/api";
import { copyErrorToClipboard } from "./errors";
import { runGatherConsole } from "./teleport-utils";

export default async function main() {
  try {
    const result = await runGatherConsole(
      "try { game.setSpeedModifier(4); copy('GATHERCHEATS_OK'); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : '')); }",
    );
    if (result.startsWith("GATHERCHEATS_ERROR:")) {
      throw new Error(result.slice("GATHERCHEATS_ERROR:".length).trim());
    }
    if (result !== "GATHERCHEATS_OK") {
      throw new Error(`Gather returned an unexpected response: ${result || "<empty>"}`);
    }
    await showHUD("Gather speed set to 4×");
  } catch (error) {
    const copied = await copyErrorToClipboard("Gather 4x Speed", error);
    await showHUD(copied ? "Gather 4x Speed failed — error copied" : "Could not set Gather speed");
  }
}
