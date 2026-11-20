import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { setSpeedScript } from "../src/speed-script.ts";

test("speed applies immediately, survives resets, replaces its timer, and stops at 1×", () => {
  const timers = new Map();
  const clipboard = [];
  const errors = [];
  let speed = 1;
  let nextId = 0;
  const context = vm.createContext({
    window: {
      setInterval(callback, delay) {
        assert.equal(delay, 60000);
        timers.set(++nextId, callback);
        return nextId;
      },
      clearInterval(id) {
        timers.delete(id);
      },
    },
    game: {
      setSpeedModifier(value) {
        speed = value;
      },
    },
    copy: (value) => clipboard.push(value),
    console: { error: (...args) => errors.push(args) },
  });
  const run = (value) => vm.runInContext(setSpeedScript(value), context);
  run("4");
  assert.equal(speed, 4);
  assert.equal(timers.size, 1);
  speed = 1;
  timers.values().next().value();
  assert.equal(speed, 4);
  const firstId = nextId;
  run("2");
  assert.equal(speed, 2);
  assert.equal(timers.size, 1);
  assert.equal(timers.has(firstId), false);

  context.game = {
    setSpeedModifier() {
      throw new Error("reconnecting");
    },
  };
  assert.doesNotThrow(() => timers.values().next().value());
  assert.equal(errors.length, 1);
  context.game = {
    setSpeedModifier(value) {
      speed = value;
    },
  };
  timers.values().next().value();
  assert.equal(speed, 2);

  run("1");
  assert.equal(speed, 1);
  assert.equal(timers.size, 0);
  assert.deepEqual(clipboard, ["GATHERCHEATS_OK", "GATHERCHEATS_OK", "GATHERCHEATS_OK"]);
});

test("invalid speed is rejected before generating console code", () => {
  assert.throws(() => setSpeedScript("5"), /Invalid speed/);
});

test("standalone script uses the same 4× timer as the extension", () => {
  const source = readFileSync(new URL("../raycast-scripts/gather-4x.applescript", import.meta.url), "utf8");
  assert.ok(source.includes(`keystroke "${setSpeedScript("4")}"`));
});
