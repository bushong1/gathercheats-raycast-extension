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
  set previousClipboardText to the clipboard as text
on error
  set previousClipboardText to ""
end try
try
  tell application "Gather" to activate
  tell application "System Events"
    repeat 30 times
      if exists process "Gather" then
        if frontmost of process "Gather" then exit repeat
      end if
      delay 0.1
    end repeat
    if not (exists process "Gather") then error "Gather did not launch."
    if not (frontmost of process "Gather") then error "Gather did not come to the foreground."
    delay 0.3
    keystroke "i" using {command down, option down}
    delay 0.8
    keystroke ${appleScriptString(js)}
    key code 36
    set commandOutput to previousClipboardText
    repeat 50 times
      delay 0.2
      set commandOutput to the clipboard as text
      if commandOutput is not previousClipboardText then exit repeat
    end repeat
    keystroke "i" using {command down, option down}
  end tell
  if commandOutput is previousClipboardText then error "Gather did not copy a console result within 10 seconds. Check that its developer console opened and accepted the command."
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
  return `try { const position = gameSpace.getMyPredictedPos(); copy(JSON.stringify({ spaceId: game.spaceId, mapId: position.map || gameSpace.getMyPlayerMap().id, x: position.x, y: position.y })); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error)); }`;
}

export function teleportScript(spot: TeleportSpot): string {
  return `if (game.spaceId !== ${JSON.stringify(spot.spaceId)}) { copy(JSON.stringify({ error: "wrong-space", spaceId: game.spaceId })); } else { copy(JSON.stringify({ success: true })); game.teleport(${JSON.stringify(spot.mapId)}, ${spot.x}, ${spot.y}); }`;
}
