#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle No-Clip
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📍
# @raycast.packageName GatherCheats
# @raycast.description Toggle arrow-key no-clip movement in Gather v1 Desktop

# Documentation:
# @raycast.author charles_bushong
# @raycast.authorURL https://raycast.com/charles_bushong

on run
	set previousClipboard to the clipboard
	set consoleOpened to false
	try
		set jsCommand to "(() => { try { " & ¬
			"const key = '__gatherCheatsNoClip'; const active = window[key]; " & ¬
			"if (active && active.version === 4 && typeof active.toggle === 'function') { copy(active.toggle() ? 'GATHERCHEATS_NO_CLIP_ON' : 'GATHERCHEATS_NO_CLIP_OFF'); return; } " & ¬
			"if (active && typeof active.remove === 'function') { active.remove(); delete window[key]; } " & ¬
			"if (typeof game === 'undefined' || typeof game.teleport !== 'function' || typeof gameSpace === 'undefined' || typeof gameSpace.getMyPredictedPos !== 'function' || typeof gameSpace.getMyPlayerMap !== 'function') throw new Error('Gather v1 movement controls are unavailable'); " & ¬
			"const offsets = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }; " & ¬
			"const held = []; const axis = (negative, positive) => { const negativeIndex = held.lastIndexOf(negative); const positiveIndex = held.lastIndexOf(positive); if (negativeIndex === -1 && positiveIndex === -1) return 0; return negativeIndex > positiveIndex ? -1 : 1; }; const movement = () => [axis('ArrowLeft', 'ArrowRight'), axis('ArrowUp', 'ArrowDown')]; let timer = null; let inFlight = false; let enabled = true; " & ¬
			"const clearTimer = () => { if (timer !== null) window.clearTimeout(timer); timer = null; }; " & ¬
			"const stop = () => { held.length = 0; clearTimer(); }; " & ¬
			"const schedule = (delay) => { clearTimer(); if (!enabled || held.length === 0) return; timer = window.setTimeout(() => { timer = null; void step(); }, delay); }; " & ¬
			"const step = async () => { if (!enabled || held.length === 0 || inFlight) return; const offset = movement(); const direction = offset.join(','); inFlight = true; try { const position = gameSpace.getMyPredictedPos(); const map = gameSpace.getMyPlayerMap(); const dimensions = map?.dimensions; if (!position || !map?.id || !Array.isArray(dimensions) || !Number.isFinite(dimensions[0]) || !Number.isFinite(dimensions[1])) return; const x = position.x + offset[0]; const y = position.y + offset[1]; if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= dimensions[0] || y >= dimensions[1]) return; await game.teleport(map.id, x, y); } catch (error) { console.error('GatherCheats no-clip teleport failed', error); } finally { inFlight = false; if (enabled && held.length > 0) schedule(movement().join(',') === direction ? 90 : 0); } }; " & ¬
			"const isTyping = (target) => target instanceof Element && (target.isContentEditable || target.closest('input, textarea, select, [role=textbox]')); " & ¬
			"const keyDown = (event) => { if (!enabled) return; const offset = offsets[event.key]; if (!offset) return; if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.isComposing || isTyping(event.target)) { stop(); return; } event.preventDefault(); event.stopImmediatePropagation(); if (held.includes(event.key) || event.repeat) return; held.push(event.key); clearTimer(); if (!inFlight) void step(); }; " & ¬
			"const keyUp = (event) => { const index = held.indexOf(event.key); if (index === -1) return; event.preventDefault(); event.stopImmediatePropagation(); held.splice(index, 1); clearTimer(); if (held.length > 0 && !inFlight) void step(); }; " & ¬
			"const remove = () => { enabled = false; stop(); window.removeEventListener('keydown', keyDown, true); window.removeEventListener('keyup', keyUp, true); window.removeEventListener('blur', stop, true); }; " & ¬
			"const toggle = () => { enabled = !enabled; if (!enabled) stop(); return enabled; }; " & ¬
			"window.addEventListener('keydown', keyDown, true); window.addEventListener('keyup', keyUp, true); window.addEventListener('blur', stop, true); window[key] = { version: 4, remove, toggle }; copy('GATHERCHEATS_NO_CLIP_ON'); " & ¬
			"} catch (error) { copy('GATHERCHEATS_ERROR: ' + String(error)); } })()"

		set the clipboard to "GATHERCHEATS_PENDING"
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
			set consoleOpened to true
			delay 0.8
			keystroke jsCommand
			delay 1
			key code 36
			set commandOutput to "GATHERCHEATS_PENDING"
			repeat 150 times
				delay 0.2
				set commandOutput to the clipboard as text
				if commandOutput starts with "GATHERCHEATS_NO_CLIP_" or commandOutput starts with "GATHERCHEATS_ERROR:" then exit repeat
			end repeat
			keystroke "i" using {command down, option down}
			set consoleOpened to false
		end tell

		if commandOutput is "GATHERCHEATS_NO_CLIP_ON" then
			set the clipboard to previousClipboard
			display notification "Hold an arrow key to teleport" with title "GatherCheats — No-Clip Enabled"
		else if commandOutput is "GATHERCHEATS_NO_CLIP_OFF" then
			set the clipboard to previousClipboard
			display notification "Normal movement restored" with title "GatherCheats — No-Clip Disabled"
		else if commandOutput starts with "GATHERCHEATS_ERROR:" then
			error commandOutput
		else
			error "Gather did not confirm the no-clip toggle within 30 seconds. Check that its developer console accepted the command."
		end if
	on error errorMessage number errorNumber
		if consoleOpened then
			try
				tell application "System Events" to keystroke "i" using {command down, option down}
			end try
		end if
		set the clipboard to "GatherCheats — Toggle No-Clip failed (" & errorNumber & "): " & errorMessage
		display notification "Error details copied to the clipboard" with title "GatherCheats"
	end try
end run
