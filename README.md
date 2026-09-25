# GatherCheats

GatherCheats adds speed and teleport commands for the Gather v1 desktop app on macOS. It does not support Gather v2 beta. The extension uses AppleScript and System Events to operate Gather's developer console.

## Raycast commands

| Command                    | What it does                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **Set 4x Speed**           | Sets Gather v1's speed modifier to 4×. Get on and off a go-kart to reset the speed.                 |
| **Save Current Spot**      | Saves your current Gather v1 space, map, and position under a name. Gather must be open in a space. |
| **Teleport to Saved Spot** | Search saved spots and teleport to one. Use the Action Panel to remove a saved spot.                |

Saved spots are kept in Raycast's local storage for the GatherCheats extension. They are not stored in the repository or in a regular file, and the standalone AppleScript cannot read Raycast's managed storage. Spots are labeled with their Gather space ID; teleporting only runs when that same space is open.

## Standalone Raycast scripts

The [`raycast-scripts`](raycast-scripts) directory contains script-command versions for Gather v1 Desktop workflows that do not need the Raycast extension UI.

`gather-4x.applescript` sets the speed modifier to 4×. `copy-current-location.applescript` copies your current Gather location as an entry for `teleport-to-saved-spot.applescript`, which offers a menu of favorite locations.

To add a favorite, run **Copy Current Location** while you are at the spot, paste its output into the `teleportSpots` list near the top of `teleport-to-saved-spot.applescript`, and replace `New Spot` with a useful name. An entry looks like this:

```applescript
{"Office", "GATHER_SPACE_ID", "MAP_ID", 12, 34}
```

The list starts as `property teleportSpots : {}`. Paste entries between its outer braces, separating multiple entries with commas.

The **Teleport to Saved Spot** command's Action Panel includes **Copy Script Entry**. Paste the copied entry into the `teleportSpots` list. The script's list is separate from the extension's saved spots and must be updated manually when you add or remove destinations.

To use these scripts, add the files from `raycast-scripts` to a folder configured in Raycast's Script Commands preferences.

## Permissions

The commands activate Gather, open its developer console with ⌘⌥I, and send keystrokes through System Events. macOS may ask you to allow Raycast or `osascript` to control Gather and to grant Accessibility access. Enable the requested access in **System Settings → Privacy & Security → Automation** or **Accessibility**.

In development mode, the extension copies error details to the clipboard for debugging. Published commands show an error without replacing your clipboard. Standalone script commands handle their own errors separately.

## Development and publishing

Use Node.js LTS and npm from the extension directory:

```sh
nvm use
npm install
npm run dev
```

Run `npm run build` to build the extension and `npm run publish` to submit it to Raycast's public extensions repository for review.
