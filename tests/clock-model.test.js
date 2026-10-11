import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  actionPoints,
  clockMinutes,
  createClock,
  diceValues,
  formatTime,
  normalizeClock,
  resetClock,
  restore,
  spend,
  visibleClocks
} from "../src/clock-model.js";

const identity = (key) => key;

function clock(overrides = {}) {
  return normalizeClock({
    id: "c1",
    name: "Clock",
    diceCount: 3,
    faces: 6,
    remaining: 18,
    showTime: true,
    startHour: 18,
    pipMinutes: 20,
    visibility: "players",
    messages: "public",
    chime: true,
    criticalMessage: "Time is up.",
    actions: [],
    ...overrides
  });
}

test("a preset gives a full clock with translated texts", () => {
  const t = (key) => `[${key}]`;

  const created = createClock("torch", { id: "abc", t });

  assert.equal(created.id, "abc");
  assert.equal(created.name, `[${PRESETS.torch.name}]`);
  assert.equal(created.remaining, created.diceCount * created.faces);
  assert.equal(created.showTime, false);
  assert.ok(created.actions.length > 0);
  assert.ok(created.actions.every((action) => action.label.startsWith("[") && action.id));
});

test("every preset makes a valid clock", () => {
  for (const presetId of Object.keys(PRESETS)) {
    const created = createClock(presetId, { id: presetId, t: identity });

    assert.deepEqual(normalizeClock(created), created, presetId);
  }
});

test("dice show the remaining points, the last die emptying first", () => {
  assert.deepEqual(diceValues(clock({ remaining: 14 })), [6, 6, 2]);
  assert.deepEqual(diceValues(clock({ remaining: 5 })), [5, 0, 0]);
});

test("spending points announces each full hour crossed and the end", () => {
  const result = spend(clock({ remaining: 4 }), 4);

  assert.equal(result.clock.remaining, 0);
  assert.deepEqual(result.events, [
    { type: "hour", minutes: 23 * 60 },
    { type: "hour", minutes: 24 * 60 },
    { type: "end" }
  ]);
});

test("spending stops at zero and never goes below", () => {
  const result = spend(clock({ remaining: 1 }), 5);

  assert.equal(result.clock.remaining, 0);
  assert.equal(result.events.filter((event) => event.type === "end").length, 1);
});

test("a clock without time only announces the end", () => {
  const result = spend(clock({ showTime: false, remaining: 4 }), 4);

  assert.deepEqual(result.events, [{ type: "end" }]);
});

test("the time follows the points spent, minutes included", () => {
  assert.equal(clockMinutes(clock({ remaining: 16 })), 18 * 60 + 40);
  assert.equal(clockMinutes(clock({ showTime: false })), null);
});

test("an action costs points, or hours converted with the minutes per point", () => {
  const twentyMinutes = clock({ pipMinutes: 20 });

  assert.equal(actionPoints(twentyMinutes, { amount: 2, unit: "point" }), 2);
  assert.equal(actionPoints(twentyMinutes, { amount: 1, unit: "hour" }), 3);
  assert.equal(actionPoints(clock({ pipMinutes: 90 }), { amount: 1, unit: "hour" }), 1);
});

test("restoring and resetting stay within the dice", () => {
  assert.equal(restore(clock({ remaining: 17 }), 5).remaining, 18);
  assert.equal(resetClock(clock({ remaining: 3 })).remaining, 18);
});

test("times are written in 24-hour or 12-hour format", () => {
  const patterns = { h24: "{hour}h{minute}", h12: "{hour}:{minute} {period}" };

  assert.equal(formatTime(18 * 60 + 5, "24h", patterns), "18h05");
  assert.equal(formatTime(25 * 60, "24h", patterns), "01h00");
  assert.equal(formatTime(18 * 60 + 5, "12h", patterns), "6:05 PM");
  assert.equal(formatTime(30, "12h", patterns), "12:30 AM");
});

test("settings out of range or unknown are brought back to something usable", () => {
  const fixed = normalizeClock({
    id: "c2",
    name: "  ",
    diceCount: 40,
    faces: 1,
    remaining: 999,
    startHour: 30,
    pipMinutes: 0,
    visibility: "everyone",
    messages: "loud",
    actions: [
      { id: "a1", label: "Search", icon: "fa-search", amount: 1, unit: "point" },
      { id: "a2", label: "", icon: "fa-bed", amount: 1, unit: "hour" },
      { id: "a3", label: "Wait", icon: "", amount: 0, unit: "day" }
    ]
  });

  assert.equal(fixed.diceCount, 8);
  assert.equal(fixed.faces, 2);
  assert.equal(fixed.remaining, 16);
  assert.equal(fixed.startHour, 23);
  assert.equal(fixed.pipMinutes, 1);
  assert.equal(fixed.visibility, "players");
  assert.equal(fixed.messages, "public");
  assert.equal(fixed.name, "");
  assert.deepEqual(fixed.actions, [
    { id: "a1", label: "Search", icon: "fa-search", amount: 1, unit: "point" },
    { id: "a3", label: "Wait", icon: "fa-hourglass-half", amount: 1, unit: "point" }
  ]);
});

test("players only see the clocks shared with them", () => {
  const clocks = [clock({ id: "shared" }), clock({ id: "secret", visibility: "gm" })];

  assert.deepEqual(visibleClocks(clocks, false).map((entry) => entry.id), ["shared"]);
  assert.deepEqual(visibleClocks(clocks, true).map((entry) => entry.id), ["shared", "secret"]);
});
