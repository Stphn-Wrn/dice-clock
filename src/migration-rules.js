import { createClock, normalizeClock } from "./clock-model.js";

// Settings of the SotDL Companion's clock, with the defaults it used.
export const WORLD_RULES = {
  diceClockDiceCount: { oldDefault: 3 },
  diceClockFaces: { oldDefault: 6 },
  diceClockPipMinutes: { oldDefault: 20 },
  diceClockStartHour: { oldDefault: 18 },
  diceClockSoundPath: { oldDefault: "modules/sodl-companion/sounds/vecna-clock.mp3" },
  diceClockCriticalMessage: { oldDefault: "SODL.DiceClock.DefaultCriticalMessage" },
  diceClockState: { oldDefault: { remaining: 18, hour: 18 } }
};

export const CLIENT_RULES = {};

// The Companion had one clock, built like the Death House preset: the values the GM
// changed are applied on top of that preset to make this module's first clock.
export function toClockSettings(changed, { id, t }) {
  if (Object.keys(changed).length === 0) {
    return {};
  }
  const clock = createClock("deathHouse", { id, t });
  const overrides = {};
  if ("diceClockDiceCount" in changed) {
    overrides.diceCount = changed.diceClockDiceCount;
  }
  if ("diceClockFaces" in changed) {
    overrides.faces = changed.diceClockFaces;
  }
  if ("diceClockPipMinutes" in changed) {
    overrides.pipMinutes = changed.diceClockPipMinutes;
  }
  if ("diceClockStartHour" in changed) {
    overrides.startHour = changed.diceClockStartHour;
  }
  if ("diceClockCriticalMessage" in changed) {
    overrides.criticalMessage = changed.diceClockCriticalMessage;
  }
  overrides.remaining = changed.diceClockState?.remaining;
  const settings = { clocks: { clocks: [normalizeClock({ ...clock, ...overrides })] } };
  if ("diceClockSoundPath" in changed) {
    settings.soundPath = changed.diceClockSoundPath;
  }
  return settings;
}
