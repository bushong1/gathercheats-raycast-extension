import { Action, ActionPanel, Clipboard, Icon, List, showHUD, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { copyErrorToClipboard } from "./errors";
import { getSavedSpots, runGatherConsole, setSavedSpots, TeleportSpot, teleportScript } from "./teleport-utils";

export default function TeleportToGatherSpot() {
  const [spots, setSpots] = useState<TeleportSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSavedSpots()
      .then(setSpots)
      .catch(async (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        const copied = await copyErrorToClipboard("Load Saved Gather Spots", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Could Not Load Saved Spots",
          message: copied ? "Error details copied to the clipboard" : message.slice(0, 180),
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function teleportTo(spot: TeleportSpot) {
    try {
      const result = await runGatherConsole(teleportScript(spot));
      const response: unknown = JSON.parse(result);
      if (typeof response === "object" && response !== null && "error" in response) {
        throw new Error("This spot belongs to a different Gather space. Open that space and try again.");
      }
      if (typeof response !== "object" || response === null || !("success" in response) || response.success !== true) {
        throw new Error("Gather did not confirm the teleport. Make sure a space is open and try again.");
      }
      await showHUD(`Teleported to ${spot.label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const copied = await copyErrorToClipboard(`Teleport to ${spot.label}`, error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Teleport",
        message: copied ? "Error details copied to the clipboard" : message.slice(0, 180),
      });
    }
  }

  async function removeSpot(spot: TeleportSpot) {
    try {
      const nextSpots = spots.filter((candidate) => candidate.id !== spot.id);
      await setSavedSpots(nextSpots);
      setSpots(nextSpots);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const copied = await copyErrorToClipboard(`Remove Gather Spot ${spot.label}`, error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Remove Spot",
        message: copied ? "Error details copied to the clipboard" : message.slice(0, 180),
      });
    }
  }

  async function copyScriptEntry(spot: TeleportSpot) {
    const scriptEntry = `{${JSON.stringify(spot.label)}, ${JSON.stringify(spot.spaceId)}, ${JSON.stringify(spot.mapId)}, ${spot.x}, ${spot.y}}`;
    try {
      await Clipboard.copy(scriptEntry);
      await showHUD(`Copied script entry for ${spot.label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const copied = await copyErrorToClipboard(`Copy Script Entry for ${spot.label}`, error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Copy Script Entry",
        message: copied ? "Error details copied to the clipboard" : message.slice(0, 180),
      });
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search saved Gather spots">
      {spots.map((spot) => (
        <List.Item
          key={spot.id}
          title={spot.label}
          subtitle={`${spot.spaceId} · ${spot.mapId} (${spot.x}, ${spot.y})`}
          icon={Icon.Pin}
          actions={
            <ActionPanel>
              <Action title="Teleport" icon={Icon.Airplane} onAction={() => teleportTo(spot)} />
              <Action title="Copy Script Entry" icon={Icon.Clipboard} onAction={() => copyScriptEntry(spot)} />
              <Action
                title="Remove Spot"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => removeSpot(spot)}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && spots.length === 0 && (
        <List.EmptyView
          title="No Saved Spots"
          description="Run Save Current Spot while Gather is open to add a destination."
        />
      )}
    </List>
  );
}
