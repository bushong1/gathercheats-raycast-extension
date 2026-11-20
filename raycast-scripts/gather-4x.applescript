#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Gather 4x Speed
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 💨
# @raycast.packageName GatherCheats
# @raycast.description Set 4x speed immediately and every minute in Gather v1 Desktop for macOS

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
        -- Dismiss Settings, select Console, and focus its input before typing.
        key code 53
        keystroke "j" using {command down, option down}
        delay 0.3
        keystroke "`" using {control down}
        delay 0.2
        keystroke "a" using {command down}

        -- Execute in console
		keystroke "(() => { try { const key = '__gatherCheatsSpeedInterval'; window.clearInterval(window[key]); delete window[key]; game.setSpeedModifier(4); if (4 !== 1) { window[key] = window.setInterval(() => { try { game.setSpeedModifier(4); } catch (error) { console.error('GatherCheats speed reapply failed', error); } }, 60000); } copy('GATHERCHEATS_OK'); } catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : '')); } })()"
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
