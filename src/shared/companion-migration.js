import { MODULE_ID } from "./constants.js";

// This tool used to live in the SotDL Companion module, which stored its data under this id.
const OLD_MODULE_ID = "sodl-companion";
const WORLD_FLAG = "companionMigrated";
const CLIENT_FLAG = "companionMigratedClient";

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Keeps the old values the user actually changed, in the order of `rules`.
// `rules` maps a setting key to { oldDefault }: the Companion's default for it.
export function planMigration(oldValues, rules) {
  const values = {};
  for (const [key, rule] of Object.entries(rules)) {
    if (!(key in oldValues) || sameValue(oldValues[key], rule.oldDefault)) {
      continue;
    }
    values[key] = oldValues[key];
  }
  return values;
}

function parseStored(value) {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function readOldWorldValues(keys) {
  const storage = game.settings.storage.get("world");
  const values = {};
  for (const key of keys) {
    const setting = storage.find((entry) => entry.key === `${OLD_MODULE_ID}.${key}`);
    if (setting) {
      values[key] = parseStored(setting.value);
    }
  }
  return values;
}

function readOldClientValues(keys) {
  const values = {};
  for (const key of keys) {
    const stored = globalThis.localStorage?.getItem(`${OLD_MODULE_ID}.${key}`);
    if (stored !== null && stored !== undefined) {
      values[key] = parseStored(stored);
    }
  }
  return values;
}

export function registerMigrationSettings() {
  game.settings.register(MODULE_ID, WORLD_FLAG, { scope: "world", config: false, type: Boolean, default: false });
  game.settings.register(MODULE_ID, CLIENT_FLAG, { scope: "client", config: false, type: Boolean, default: false });
}

async function applyValues(values) {
  for (const [key, value] of Object.entries(values)) {
    await game.settings.set(MODULE_ID, key, value);
  }
}

// Runs once per world (GM) and once per browser. Returns true when world data was imported.
// `toWorldSettings` turns the changed old values into this module's settings, when they differ.
export async function migrateFromCompanion({ worldRules, clientRules, toWorldSettings = (values) => values }) {
  let importedWorld = false;
  if (game.user.isGM && !game.settings.get(MODULE_ID, WORLD_FLAG)) {
    const values = toWorldSettings(planMigration(readOldWorldValues(Object.keys(worldRules)), worldRules));
    await applyValues(values);
    await game.settings.set(MODULE_ID, WORLD_FLAG, true);
    importedWorld = Object.keys(values).length > 0;
  }
  if (!game.settings.get(MODULE_ID, CLIENT_FLAG)) {
    await applyValues(planMigration(readOldClientValues(Object.keys(clientRules)), clientRules));
    await game.settings.set(MODULE_ID, CLIENT_FLAG, true);
  }
  return importedWorld;
}
