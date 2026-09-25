#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Copy Current Location
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📍
# @raycast.packageName GatherCheats
# @raycast.description Copy the current Gather location as a teleport script entry

# Documentation:
# @raycast.author charles_bushong
# @raycast.authorURL https://raycast.com/charles_bushong

on run
	try
		set the clipboard to "GATHERCHEATS_PENDING"
		tell application "Gather" to activate
		delay 0.2

		tell application "System Events"
			keystroke "i" using {command down, option down}
			delay 0.5
			keystroke "try { const p = gameSpace.getMyPredictedPos(); const mapId = p.map || gameSpace.getMyPlayerMap().id; if (!game.spaceId || !mapId || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Current Gather position unavailable'); copy('{' + JSON.stringify('New Spot') + ', ' + JSON.stringify(game.spaceId) + ', ' + JSON.stringify(mapId) + ', ' + p.x + ', ' + p.y + '}'); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : '')); }"
			key code 36
			delay 0.3
			set copiedLocation to the clipboard as text
			keystroke "i" using {command down, option down}
		end tell

		if copiedLocation contains "GATHERCHEATS_ERROR:" then
			error copiedLocation number 1
		end if
		if copiedLocation is "" then
			error "Gather did not copy a location. Make sure a space is open." number 2
		end if
		if character 1 of copiedLocation is not "{" then
			error "Gather did not return a teleport entry. Make sure a space is open." number 3
		end if

		display notification "Location copied. Paste it into teleportSpots and rename New Spot." with title "GatherCheats"
	on error errorMessage number errorNumber
		set the clipboard to "GatherCheats — Copy Current Location failed (" & errorNumber & "): " & errorMessage
		display notification "Error details copied to the clipboard" with title "GatherCheats"
	end try
end run
