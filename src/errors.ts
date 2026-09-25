import { Clipboard } from "@raycast/api";

export async function copyErrorToClipboard(context: string, error: unknown): Promise<boolean> {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ""}`
      : String(error);

  try {
    await Clipboard.copy(`GatherCheats — ${context}\n\n${detail}`);
    return true;
  } catch {
    return false;
  }
}
