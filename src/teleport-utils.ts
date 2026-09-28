import { LocalStorage, PopToRootType, closeMainWindow } from "@raycast/api";
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
const GATHER_NOT_FOCUSED = "GATHERCHEATS_NOT_FOCUSED";

export class GatherNotFocusedError extends Error {
  constructor() {
    super("Focus the Gather v1 Desktop window and try again.");
    this.name = "GatherNotFocusedError";
  }
}

export async function runGatherConsole(
  js: string,
  options: { resultTimeoutSeconds?: number; settleSeconds?: number; resetRaycast?: boolean } = {},
): Promise<string> {
  const resultTimeoutSeconds = options.resultTimeoutSeconds ?? 10;
  const settleSeconds = options.settleSeconds ?? 0;
  if (!Number.isInteger(resultTimeoutSeconds) || resultTimeoutSeconds < 1 || resultTimeoutSeconds > 60) {
    throw new Error("Result timeout must be between 1 and 60 seconds.");
  }
  if (!Number.isFinite(settleSeconds) || settleSeconds < 0 || settleSeconds > 5) {
    throw new Error("Command settle time must be between 0 and 5 seconds.");
  }
  const clipboardPolls = resultTimeoutSeconds * 5;
  const script = `
tell application "System Events"
  if not (exists process "Gather") then return "${GATHER_NOT_FOCUSED}"
  if not (frontmost of process "Gather") then return "${GATHER_NOT_FOCUSED}"
end tell
set previousClipboard to the clipboard
try
  set previousClipboardText to the clipboard as text
on error
  set previousClipboardText to ""
end try
try
  tell application "System Events"
    if not (frontmost of process "Gather") then error "Gather lost focus before the command could run."
    delay 0.3
    keystroke "i" using {command down, option down}
    delay 0.8
    keystroke ${appleScriptString(js)}
    ${settleSeconds > 0 ? `delay ${settleSeconds}` : ""}
    key code 36
    set commandOutput to previousClipboardText
    repeat ${clipboardPolls} times
      delay 0.2
      set commandOutput to the clipboard as text
      if commandOutput is not previousClipboardText then exit repeat
    end repeat
    keystroke "i" using {command down, option down}
  end tell
  if commandOutput is previousClipboardText then error "Gather did not copy a console result within ${resultTimeoutSeconds} seconds. Check that its developer console opened and accepted the command."
  set the clipboard to previousClipboard
  return commandOutput
on error errorMessage number errorNumber
  set the clipboard to previousClipboard
  error errorMessage number errorNumber
end try
`;

  await closeMainWindow(
    options.resetRaycast ? { clearRootSearch: true, popToRootType: PopToRootType.Immediate } : undefined,
  );
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
  const result = stdout.trim();
  if (result === GATHER_NOT_FOCUSED) throw new GatherNotFocusedError();
  return result;
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
