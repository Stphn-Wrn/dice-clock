import { test } from "node:test";
import assert from "node:assert/strict";
import { planMigration } from "../src/shared/companion-migration.js";
import { CLIENT_RULES, WORLD_RULES, toClockSettings } from "../src/migration-rules.js";

const identity = (key) => key;

test("keeps only the Companion clock values the GM changed", () => {
  const oldValues = { diceClockDiceCount: 4, diceClockFaces: 6, diceClockStartHour: 20 };

  const values = planMigration(oldValues, WORLD_RULES);

  assert.deepEqual(values, { diceClockDiceCount: 4, diceClockStartHour: 20 });
});

test("the Companion's clock becomes the first clock, with its settings and the points left", () => {
  const changed = { diceClockDiceCount: 4, diceClockStartHour: 20, diceClockState: { remaining: 9, hour: 23 } };

  const settings = toClockSettings(changed, { id: "old", t: identity });

  assert.equal(settings.clocks.clocks.length, 1);
  const [clock] = settings.clocks.clocks;
  assert.equal(clock.id, "old");
  assert.equal(clock.diceCount, 4);
  assert.equal(clock.faces, 6);
  assert.equal(clock.startHour, 20);
  assert.equal(clock.pipMinutes, 20);
  assert.equal(clock.remaining, 9);
  assert.equal(clock.showTime, true);
  assert.equal(settings.soundPath, undefined);
});

test("a custom final message and chime sound are kept, the old defaults are not", () => {
  const custom = planMigration(
    { diceClockSoundPath: "sounds/bell.ogg", diceClockCriticalMessage: "Midnight strikes.", diceClockFaces: 8 },
    WORLD_RULES
  );
  const defaults = planMigration(
    { diceClockSoundPath: "modules/sodl-companion/sounds/vecna-clock.mp3", diceClockCriticalMessage: "SODL.DiceClock.DefaultCriticalMessage" },
    WORLD_RULES
  );

  const settings = toClockSettings(custom, { id: "old", t: identity });

  assert.equal(settings.soundPath, "sounds/bell.ogg");
  assert.equal(settings.clocks.clocks[0].criticalMessage, "Midnight strikes.");
  assert.deepEqual(defaults, {});
});

test("a world that never touched the Companion's clock starts with no clock", () => {
  assert.deepEqual(toClockSettings({}, { id: "old", t: identity }), {});
});

test("the clock has no per-user setting to bring over", () => {
  assert.deepEqual(CLIENT_RULES, {});
});
