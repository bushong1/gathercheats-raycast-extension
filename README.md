# GatherCheats

GatherCheats adds quick speed and teleport commands for Gather Desktop to Raycast. It is a macOS-only extension because it uses AppleScript and System Events to operate Gather's developer console.

## Raycast commands

| Command                      | What it does                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **GatherCheats 4x Speed**    | Sets Gather's speed modifier to 4×. Get on and off a go-kart to reset the speed.                 |
| **Save Current Gather Spot** | Saves your current Gather space, map, and position under a name. Gather must be open in a space. |
| **Teleport to Gather Spot**  | Search saved spots and teleport to one. Use the Action Panel to remove a saved spot.             |

Saved spots are kept in Raycast's local storage for the GatherCheats extension. They are not stored in the repository or in a regular file, and the standalone AppleScript cannot read Raycast's managed storage. Spots are labeled with their Gather space ID; teleporting only runs when that same space is open.

## Standalone Raycast scripts

The [`raycast-scripts`](raycast-scripts) directory contains script-command versions for workflows that do not need the Raycast extension UI.

`gather-4x.applescript` sets the speed modifier to 4×. `copy-current-location.applescript` copies your current Gather location as an entry for `teleport-to-saved-spot.applescript`, which offers a menu of favorite locations.

To add a favorite, run **Copy Current Location** while you are at the spot, paste its output into the `teleportSpots` list near the top of `teleport-to-saved-spot.applescript`, and replace `New Spot` with a useful name. An entry looks like this:

```applescript
{"Office", "GATHER_SPACE_ID", "MAP_ID", 12, 34}
```

The list starts as `property teleportSpots : {}`. Paste entries between its outer braces, separating multiple entries with commas.

The **Teleport to Gather Spot** command's Action Panel includes **Copy Script Entry**. Paste the copied entry into the `teleportSpots` list. The script's list is separate from the extension's saved spots and must be updated manually when you add or remove destinations.

To use these scripts, add the files from `raycast-scripts` to a folder configured in Raycast's Script Commands preferences.

## Permissions

The commands activate Gather, open its developer console with ⌘⌥I, and send keystrokes through System Events. macOS may ask you to allow Raycast or `osascript` to control Gather and to grant Accessibility access. Enable the requested access in **System Settings → Privacy & Security → Automation** or **Accessibility**.

When a command fails, GatherCheats copies the error details to the clipboard for debugging.

## Development and publishing

Use Node.js LTS and npm from the extension directory:

```sh
nvm use
npm install
npm run dev
```

Run `npm run build` to build the extension and `npm run publish` to submit it to Raycast's public extensions repository for review.
