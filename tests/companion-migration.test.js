import { test } from "node:test";
import assert from "node:assert/strict";
import { planMigration } from "../src/shared/companion-migration.js";
import { CLIENT_RULES, WORLD_RULES } from "../src/migration-rules.js";

test("copies the clock settings the GM changed in the Companion", () => {
  const oldValues = { diceClockDiceCount: 4, diceClockFaces: 6, diceClockStartHour: 20 };

  const values = planMigration(oldValues, WORLD_RULES);

  assert.deepEqual(values, { diceClockDiceCount: 4, diceClockStartHour: 20 });
});

test("leaves the Companion's default sound and message behind, but keeps custom ones", () => {
  const defaults = {
    diceClockSoundPath: "modules/sodl-companion/sounds/vecna-clock.mp3",
    diceClockCriticalMessage: "SODL.DiceClock.DefaultCriticalMessage"
  };
  const custom = { diceClockSoundPath: "sounds/bell.ogg", diceClockCriticalMessage: "Midnight strikes." };

  assert.deepEqual(planMigration(defaults, WORLD_RULES), {});
  assert.deepEqual(planMigration(custom, WORLD_RULES), custom);
});

test("restores the clock state after its settings, so a settings change cannot reset it", () => {
  const oldValues = { diceClockState: { remaining: 7, hour: 21 }, diceClockFaces: 8 };

  const keys = Object.keys(planMigration(oldValues, WORLD_RULES));

  assert.deepEqual(keys, ["diceClockFaces", "diceClockState"]);
});

test("the clock has no per-user setting to bring over", () => {
  assert.deepEqual(CLIENT_RULES, {});
});
