#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Teleport to Saved Gather Spot
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📍
# @raycast.packageName GatherCheats
# @raycast.description Teleport to a configured Gather v1 Desktop location

# Documentation:
# @raycast.author charles_bushong
# @raycast.authorURL https://raycast.com/charles_bushong

# Add one entry per destination using this format:
# {"Spot name", "Gather space ID", "map ID", x, y}
property teleportSpots : {}

on run
	try
		if (count of teleportSpots) is 0 then
			error "Add locations to teleportSpots near the top of this script." number 1
		end if

		set spotNames to {}
		repeat with spot in teleportSpots
			set end of spotNames to item 1 of spot as text
		end repeat

		set selectedSpots to choose from list spotNames with prompt "Choose a Gather destination:" without empty selection allowed
		if selectedSpots is false then return
		set selectedName to item 1 of selectedSpots

		repeat with spot in teleportSpots
			if (item 1 of spot as text) is selectedName then
				set spaceId to item 2 of spot as text
				set mapId to item 3 of spot as text
				set xPos to item 4 of spot as text
				set yPos to item 5 of spot as text
				exit repeat
			end if
		end repeat

		set previousClipboard to the clipboard
		set jsCommand to "if (game.spaceId !== '" & spaceId & "') { copy('GATHERCHEATS_WRONG_SPACE'); } else { game.teleport('" & mapId & "', " & xPos & ", " & yPos & "); copy('GATHERCHEATS_TELEPORTED'); }"

		tell application "Gather" to activate
		delay 0.2
		tell application "System Events"
			keystroke "i" using {command down, option down}
			delay 0.5
			keystroke jsCommand
			key code 36
			delay 0.3
			set commandOutput to the clipboard as text
			keystroke "i" using {command down, option down}
		end tell
		set the clipboard to previousClipboard

		if commandOutput contains "GATHERCHEATS_WRONG_SPACE" then
			error "This spot belongs to a different Gather space." number 2
		end if
		if commandOutput does not contain "GATHERCHEATS_TELEPORTED" then
			error "Gather did not confirm the teleport. Make sure a space is open." number 3
		end if
	on error errorMessage number errorNumber
		set the clipboard to "GatherCheats — Teleport to Saved Gather Spot failed (" & errorNumber & "): " & errorMessage
		display notification "Error details copied to the clipboard" with title "GatherCheats"
	end try
end run
