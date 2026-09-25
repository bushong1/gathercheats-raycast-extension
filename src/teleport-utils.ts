import { LocalStorage, closeMainWindow } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const STORAGE_KEY = "gather-teleport-spots";

export type TeleportSpot = {
  id: string;
  label: string;
  spaceId: string;
  mapId: string;
  x: number;
  y: number;
};

export type CurrentPosition = Omit<TeleportSpot, "id" | "label">;

const appleScriptString = (value: string) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

export async function runGatherConsole(js: string): Promise<string> {
  const script = `
set previousClipboard to the clipboard
try
  tell application "Gather" to activate
  delay 0.2
  tell application "System Events"
    keystroke "i" using {command down, option down}
    delay 0.5
    keystroke ${appleScriptString(js)}
    key code 36
    delay 0.3
    set commandOutput to the clipboard as text
    keystroke "i" using {command down, option down}
  end tell
  set the clipboard to previousClipboard
  return commandOutput
on error errorMessage number errorNumber
  set the clipboard to previousClipboard
  error errorMessage number errorNumber
end try
`;

  await closeMainWindow();
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
  return stdout.trim();
}

export async function getSavedSpots(): Promise<TeleportSpot[]> {
  const storedSpots = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!storedSpots) return [];

  try {
    const parsed: unknown = JSON.parse(storedSpots);
    return Array.isArray(parsed) ? (parsed as TeleportSpot[]) : [];
  } catch {
    return [];
  }
}

export async function setSavedSpots(spots: TeleportSpot[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
}

export function capturePositionScript(): string {
  return `copy(JSON.stringify((() => { const position = gameSpace.getMyPredictedPos(); return { spaceId: game.spaceId, mapId: position.map || gameSpace.getMyPlayerMap().id, x: position.x, y: position.y }; })()))`;
}

export function teleportScript(spot: TeleportSpot): string {
  return `if (game.spaceId !== ${JSON.stringify(spot.spaceId)}) { copy(JSON.stringify({ error: "wrong-space", spaceId: game.spaceId })); } else { game.teleport(${JSON.stringify(spot.mapId)}, ${spot.x}, ${spot.y}); copy(JSON.stringify({ success: true })); }`;
}
