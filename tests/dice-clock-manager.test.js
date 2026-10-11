import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTranslator } from "../src/shared/i18n.js";

const english = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8"));
const translate = createTranslator(english);

// Minimal stand-in for the Foundry globals the manager uses.
function installFakeFoundry({ isGM = true } = {}) {
  const settings = new Map([
    ["dice-clock.clocks", { clocks: [] }],
    ["dice-clock.soundPath", "modules/dice-clock/sounds/chime.wav"],
    ["dice-clock.timeFormat", "24h"]
  ]);
  const fake = { messages: [], sounds: [], nextId: 1 };
  globalThis.game = {
    user: { isGM },
    settings: {
      get: (module, key) => structuredClone(settings.get(`${module}.${key}`)),
      set: async (module, key, value) => settings.set(`${module}.${key}`, structuredClone(value))
    },
    i18n: { localize: (key) => translate(key), format: (key, data) => translate(key, data) }
  };
  globalThis.foundry = {
    utils: { randomID: () => `id${fake.nextId++}` },
    audio: { AudioHelper: { play: (options, push) => fake.sounds.push({ src: options.src, push }) } }
  };
  globalThis.Handlebars = { escapeExpression: (value) => String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;") };
  globalThis.ChatMessage = {
    create: async (data) => fake.messages.push(data),
    getWhisperRecipients: () => ["gm-user"]
  };
  return fake;
}

const { DiceClockManager } = await import("../src/dice-clock-manager.js");

let fake;
beforeEach(() => {
  fake = installFakeFoundry();
});

test("a new clock comes from its preset, with translated names", async () => {
  const clock = await DiceClockManager.addClock("deathHouse");

  assert.equal(clock.name, "Death House");
  assert.deepEqual(clock.actions.map((action) => action.label), ["Room / Floor", "Short rest"]);
  assert.deepEqual(DiceClockManager.getClocks().map((entry) => entry.id), [clock.id]);
});

test("an action spends its cost and announces each full hour with its time", async () => {
  const clock = await DiceClockManager.addClock("deathHouse");
  const shortRest = clock.actions.find((action) => action.unit === "hour");

  await DiceClockManager.runAction(clock.id, shortRest.id);

  assert.equal(DiceClockManager.getClock(clock.id).remaining, 15);
  assert.equal(fake.messages.length, 1);
  assert.match(fake.messages[0].content, /Death House chimes/);
  assert.match(fake.messages[0].content, /It is now <strong>19:00<\/strong>/);
  assert.equal(fake.messages[0].whisper, undefined);
  assert.deepEqual(fake.sounds, [{ src: "modules/dice-clock/sounds/chime.wav", push: true }]);
});

test("a GM-only clock whispers its messages and keeps its chime to the GM", async () => {
  const clock = await DiceClockManager.addClock("threat");

  await DiceClockManager.spend(clock.id, 12);

  assert.equal(fake.messages.length, 1);
  assert.deepEqual(fake.messages[0].whisper, ["gm-user"]);
  assert.match(fake.messages[0].content, /The threat comes to pass\./);
  assert.deepEqual(fake.sounds, []);
});

test("a clock without time shows its points, and players only see shared clocks", async () => {
  const torch = await DiceClockManager.addClock("torch");
  await DiceClockManager.addClock("threat");

  assert.equal(DiceClockManager.statusLine(DiceClockManager.getClock(torch.id)), "6 / 6 points");

  game.user.isGM = false;
  assert.deepEqual(DiceClockManager.getVisibleClocks().map((clock) => clock.id), [torch.id]);
});

test("players cannot change a clock", async () => {
  const clock = await DiceClockManager.addClock("torch");
  game.user.isGM = false;

  await DiceClockManager.spend(clock.id, 1);
  await DiceClockManager.removeClock(clock.id);

  assert.equal(DiceClockManager.getClock(clock.id).remaining, 6);
});

test("editing keeps the clock valid and the final message is escaped in the chat", async () => {
  const clock = await DiceClockManager.addClock("custom");

  await DiceClockManager.updateClock(clock.id, { diceCount: 1, faces: 4, remaining: 4, criticalMessage: "<b>Boom</b>", chime: false });
  await DiceClockManager.spend(clock.id, 10);

  assert.equal(DiceClockManager.getClock(clock.id).remaining, 0);
  assert.match(fake.messages.at(-1).content, /&lt;b&gt;Boom&lt;\/b&gt;/);
});

test("the 12-hour format is used when chosen", async () => {
  await game.settings.set("dice-clock", "timeFormat", "12h");
  const clock = await DiceClockManager.addClock("deathHouse");

  assert.equal(DiceClockManager.statusLine(clock), "6:00 PM");
});
