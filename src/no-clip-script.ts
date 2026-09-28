export const toggleInstalledNoClipScript = `
(() => {
  try {
    const active = window.__gatherCheatsNoClip;
    if (active && active.version === 3 && typeof active.toggle === 'function') {
      copy(active.toggle() ? 'GATHERCHEATS_NO_CLIP_ON' : 'GATHERCHEATS_NO_CLIP_OFF');
    } else {
      copy('GATHERCHEATS_NO_CLIP_INSTALL');
    }
  } catch (error) {
    copy('GATHERCHEATS_ERROR: ' + String(error));
  }
})()
`.replace(/\n\s*/g, " ");

export const installNoClipScript = `
(() => {
  try {
    const key = '__gatherCheatsNoClip';
    const active = window[key];
    if (active && typeof active.remove === 'function') {
      active.remove();
      delete window[key];
    }

    if (typeof game === 'undefined' || typeof game.teleport !== 'function' ||
        typeof gameSpace === 'undefined' ||
        typeof gameSpace.getMyPredictedPos !== 'function' ||
        typeof gameSpace.getMyPlayerMap !== 'function') {
      throw new Error('Gather v1 movement controls are unavailable');
    }

    const offsets = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const held = [];
    let timer = null;
    let inFlight = false;
    let enabled = true;
    const clearTimer = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };
    const stop = () => {
      held.length = 0;
      clearTimer();
    };
    const schedule = (delay) => {
      clearTimer();
      if (!enabled || held.length === 0) return;
      timer = window.setTimeout(() => {
        timer = null;
        void step();
      }, delay);
    };
    const step = async () => {
      if (!enabled || held.length === 0 || inFlight) return;
      const direction = held[held.length - 1];
      const offset = offsets[direction];
      inFlight = true;
      try {
        const position = gameSpace.getMyPredictedPos();
        const map = gameSpace.getMyPlayerMap();
        const dimensions = map?.dimensions;
        if (!position || !map?.id || !Array.isArray(dimensions) ||
            !Number.isFinite(dimensions[0]) || !Number.isFinite(dimensions[1])) return;
        const x = position.x + offset[0];
        const y = position.y + offset[1];
        if (!Number.isFinite(x) || !Number.isFinite(y) ||
            x < 0 || y < 0 || x >= dimensions[0] || y >= dimensions[1]) return;
        await game.teleport(map.id, x, y);
      } catch (error) {
        console.error('GatherCheats no-clip teleport failed', error);
      } finally {
        inFlight = false;
        if (enabled && held.length > 0) schedule(held[held.length - 1] === direction ? 90 : 0);
      }
    };
    const isTyping = (target) => target instanceof Element &&
      (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'));
    const keyDown = (event) => {
      if (!enabled) return;
      const offset = offsets[event.key];
      if (!offset) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.isComposing ||
          isTyping(event.target)) {
        stop();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (held.includes(event.key)) return;
      if (event.repeat) return;
      held.push(event.key);
      clearTimer();
      if (!inFlight) void step();
    };
    const keyUp = (event) => {
      const index = held.indexOf(event.key);
      if (index === -1) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      held.splice(index, 1);
      clearTimer();
      if (held.length > 0 && !inFlight) void step();
    };
    const remove = () => {
      enabled = false;
      stop();
      window.removeEventListener('keydown', keyDown, true);
      window.removeEventListener('keyup', keyUp, true);
      window.removeEventListener('blur', stop, true);
    };
    const toggle = () => {
      enabled = !enabled;
      if (!enabled) stop();
      return enabled;
    };

    window.addEventListener('keydown', keyDown, true);
    window.addEventListener('keyup', keyUp, true);
    window.addEventListener('blur', stop, true);
    window[key] = { version: 3, remove, toggle };
    copy('GATHERCHEATS_NO_CLIP_ON');
  } catch (error) {
    copy('GATHERCHEATS_ERROR: ' + String(error));
  }
})()
`.replace(/\n\s*/g, " ");
