import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { installNoClipScript, toggleInstalledNoClipScript } from "../src/no-clip-script.ts";

function createGather({ deferredTeleports = false } = {}) {
  const clipboard = [];
  const teleports = [];
  const listeners = new Map();
  const timers = new Map();
  const pendingTeleports = [];
  let nextTimerId = 0;
  let installCount = 0;
  let position = { x: 5, y: 5 };

  class Element {
    constructor(isTextField = false) {
      this.isTextField = isTextField;
      this.isContentEditable = false;
    }

    closest() {
      return this.isTextField ? this : null;
    }
  }

  const window = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    setTimeout(callback) {
      const id = ++nextTimerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const context = {
    window,
    Element,
    game: {
      teleport(mapId, x, y) {
        teleports.push({ mapId, x, y });
        position = { x, y };
        if (deferredTeleports) return new Promise((resolve) => pendingTeleports.push(resolve));
      },
    },
    gameSpace: {
      getMyPredictedPos: () => position,
      getMyPlayerMap: () => ({ id: "map-1", dimensions: [10, 10] }),
    },
    copy: (value) => clipboard.push(value),
    console,
  };

  function keyEvent(type, key, options = {}) {
    const event = {
      key,
      target: new Element(options.isTextField),
      repeat: options.repeat ?? false,
      metaKey: options.metaKey ?? false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      isComposing: false,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopImmediatePropagation() {
        this.propagationStopped = true;
      },
    };
    listeners.get(type)?.(event);
    return event;
  }

  return {
    clipboard,
    teleports,
    toggle() {
      vm.runInNewContext(toggleInstalledNoClipScript, context);
      if (clipboard.at(-1) === "GATHERCHEATS_NO_CLIP_INSTALL") {
        installCount += 1;
        vm.runInNewContext(installNoClipScript, context);
      }
    },
    runScript: (script) => vm.runInNewContext(script, context),
    installCount: () => installCount,
    installLegacy() {
      let removed = false;
      window.__gatherCheatsNoClip = { version: 3, toggle: () => false, remove: () => (removed = true) };
      return () => removed;
    },
    setPosition: (next) => (position = next),
    press: (key, options) => keyEvent("keydown", key, options),
    release: (key) => keyEvent("keyup", key),
    blur: () => listeners.get("blur")?.(),
    tick() {
      const next = timers.entries().next().value;
      if (!next) return;
      const [id, callback] = next;
      timers.delete(id);
      callback();
    },
    timerCount: () => timers.size,
    resolveTeleport: () => pendingTeleports.shift()?.(),
    async flush() {
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

test("held arrows teleport at a paced rate and key-up discards the next step", async () => {
  const gather = createGather();
  gather.toggle();
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_ON");

  assert.equal(gather.press("ArrowRight").defaultPrevented, true);
  assert.deepEqual(gather.teleports, [{ mapId: "map-1", x: 6, y: 5 }]);
  await gather.flush();
  assert.equal(gather.timerCount(), 1);

  gather.press("ArrowRight", { repeat: true });
  gather.press("ArrowRight", { repeat: true });
  assert.equal(gather.timerCount(), 1);
  gather.tick();
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 7, y: 5 });
  await gather.flush();

  assert.equal(gather.release("ArrowRight").defaultPrevented, true);
  assert.equal(gather.timerCount(), 0);
  gather.tick();
  gather.press("ArrowRight", { repeat: true });
  assert.equal(gather.teleports.length, 2);

  gather.toggle();
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_OFF");
  assert.equal(gather.press("ArrowRight").defaultPrevented, false);
  gather.toggle();
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_ON");
  assert.equal(gather.installCount(), 1);
  assert.equal(gather.press("ArrowRight").defaultPrevented, true);
});

test("standalone script installs no-clip and shares the extension toggle state", async () => {
  const source = readFileSync(new URL("../raycast-scripts/toggle-no-clip.applescript", import.meta.url), "utf8");
  const assignment = source.match(/set jsCommand to ([\s\S]*?)\n\s*set the clipboard to "GATHERCHEATS_PENDING"/);
  assert.ok(assignment, "standalone script must contain a JavaScript command");
  const script = [...assignment[1].matchAll(/"([^"]*)"/g)].map((match) => match[1]).join("");
  const gather = createGather();

  gather.runScript(script);
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_ON");
  assert.equal(gather.press("ArrowRight").defaultPrevented, true);
  assert.deepEqual(gather.teleports, [{ mapId: "map-1", x: 6, y: 5 }]);
  await gather.flush();
  gather.press("ArrowUp");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 7, y: 4 });
  gather.release("ArrowRight");
  gather.release("ArrowUp");
  await gather.flush();

  gather.toggle();
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_OFF");
  assert.equal(gather.press("ArrowRight").defaultPrevented, false);
  gather.runScript(script);
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_ON");
  assert.equal(gather.press("ArrowRight").defaultPrevented, true);
});

test("perpendicular arrows move diagonally and return to one axis on release", async () => {
  const gather = createGather();
  gather.toggle();
  gather.press("ArrowUp");
  await gather.flush();
  gather.press("ArrowRight");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 6, y: 3 });
  await gather.flush();
  gather.tick();
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 7, y: 2 });
  await gather.flush();
  gather.release("ArrowUp");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 8, y: 2 });
  gather.release("ArrowRight");
  await gather.flush();
  assert.equal(gather.timerCount(), 0);
});

test("the most recently pressed key wins when opposite arrows are held", async () => {
  const gather = createGather();
  gather.toggle();
  gather.press("ArrowLeft");
  await gather.flush();
  gather.press("ArrowRight");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 5, y: 5 });
  await gather.flush();
  gather.press("ArrowUp");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 6, y: 4 });
  await gather.flush();
  gather.release("ArrowRight");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 5, y: 3 });
});

test("one in-flight teleport cannot queue more moves after key-up", async () => {
  const gather = createGather({ deferredTeleports: true });
  gather.toggle();
  gather.press("ArrowRight");
  gather.press("ArrowRight", { repeat: true });
  assert.equal(gather.teleports.length, 1);
  assert.equal(gather.timerCount(), 0);

  gather.release("ArrowRight");
  gather.resolveTeleport();
  await gather.flush();
  assert.equal(gather.timerCount(), 0);
  assert.equal(gather.teleports.length, 1);
});

test("an active older handler is replaced rather than switched off", () => {
  const gather = createGather();
  const wasRemoved = gather.installLegacy();
  gather.toggle();
  assert.equal(wasRemoved(), true);
  assert.equal(gather.clipboard.at(-1), "GATHERCHEATS_NO_CLIP_ON");
  gather.press("ArrowDown");
  assert.deepEqual(gather.teleports, [{ mapId: "map-1", x: 5, y: 6 }]);
});

test("direction changes, typing, shortcuts, blur, and map edges are handled safely", async () => {
  const gather = createGather();
  gather.toggle();
  assert.equal(gather.press("ArrowUp", { isTextField: true }).defaultPrevented, false);
  assert.equal(gather.press("ArrowUp", { metaKey: true }).defaultPrevented, false);
  assert.equal(gather.teleports.length, 0);

  gather.press("ArrowUp");
  await gather.flush();
  gather.press("ArrowRight");
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 6, y: 3 });
  gather.release("ArrowRight");
  await gather.flush();
  gather.tick();
  assert.deepEqual(gather.teleports.at(-1), { mapId: "map-1", x: 6, y: 2 });

  gather.blur();
  assert.equal(gather.timerCount(), 0);
  gather.setPosition({ x: 0, y: 0 });
  gather.press("ArrowLeft");
  await gather.flush();
  assert.equal(gather.teleports.length, 3);
  gather.release("ArrowLeft");
});
