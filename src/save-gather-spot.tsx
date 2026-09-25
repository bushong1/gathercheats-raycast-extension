import { Action, ActionPanel, Form, popToRoot, showHUD, showToast, Toast } from "@raycast/api";
import { randomUUID } from "node:crypto";
import { copyErrorToClipboard } from "./errors";
import {
  capturePositionScript,
  CurrentPosition,
  getSavedSpots,
  runGatherConsole,
  setSavedSpots,
  TeleportSpot,
} from "./teleport-utils";

function isCurrentPosition(value: unknown): value is CurrentPosition {
  if (!value || typeof value !== "object") return false;
  const position = value as Partial<CurrentPosition>;
  return (
    typeof position.spaceId === "string" &&
    typeof position.mapId === "string" &&
    typeof position.x === "number" &&
    Number.isFinite(position.x) &&
    typeof position.y === "number" &&
    Number.isFinite(position.y)
  );
}

export default function SaveGatherSpot() {
  async function handleSubmit(values: Form.Values) {
    const label = typeof values.label === "string" ? values.label.trim() : "";
    if (!label) {
      await showToast({ style: Toast.Style.Failure, title: "Enter a spot name" });
      return;
    }

    try {
      const result = await runGatherConsole(capturePositionScript());
      if (result.startsWith("GATHERCHEATS_ERROR:")) {
        throw new Error(result.slice("GATHERCHEATS_ERROR:".length).trim());
      }
      const position: unknown = JSON.parse(result);
      if (!isCurrentPosition(position)) {
        throw new Error("Gather did not return a valid map position. Make sure you are in a Gather space.");
      }

      const spot: TeleportSpot = { id: randomUUID(), label, ...position };
      const spots = await getSavedSpots();
      await setSavedSpots([...spots, spot]);
      await popToRoot({ clearSearchBar: true });
      await showHUD(`Saved Gather spot: ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const copied = await copyErrorToClipboard("Save Current Gather Spot", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Save Gather Spot",
        message: copied ? "Error details copied to the clipboard" : message.slice(0, 180),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Current Spot" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="label" title="Spot Name" placeholder="e.g. Main Office" autoFocus />
      <Form.Description text="Gather v1 Desktop must be open in a space. The current map and position will be saved for this space." />
    </Form>
  );
}
