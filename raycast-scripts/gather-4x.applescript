#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Gather 4x Speed
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 💨
# @raycast.packageName GatherCheats
# @raycast.description Turn on 4x speed in Gather

# Documentation:
# @raycast.author charles_bushong
# @raycast.authorURL https://raycast.com/charles_bushong

try
	set previousClipboard to the clipboard
	tell application "Gather" to activate
	delay 0.2

    tell application "System Events"
        -- Open DevTools
        keystroke "i" using {command down, option down}
        delay 0.5

        -- Execute in console
		keystroke "try { game.setSpeedModifier(4); copy('GATHERCHEATS_OK'); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : '')); }"
		key code 36
		delay 0.3
		set commandOutput to the clipboard as text

        -- Close DevTools
		keystroke "i" using {command down, option down}
	end tell
	set the clipboard to previousClipboard
	if commandOutput contains "GATHERCHEATS_ERROR:" then
		error commandOutput number 1
	end if
	if commandOutput does not contain "GATHERCHEATS_OK" then
		error "Gather did not confirm the speed change." number 2
	end if
on error errorMessage number errorNumber
    set the clipboard to "GatherCheats — Gather 4x Speed failed (" & errorNumber & "): " & errorMessage
    display notification "Error details copied to the clipboard" with title "GatherCheats"
end try
